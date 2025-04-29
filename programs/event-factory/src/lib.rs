use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::instruction::{create_metadata_accounts_v3, create_master_edition_v3};
use solana_program::program::invoke_signed;
use solana_program::system_instruction;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // Replace with your program ID

#[program]
pub mod event_factory {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, treasury_fee: u64) -> Result<()> {
        let event_factory = &mut ctx.accounts.event_factory;
        event_factory.authority = ctx.accounts.authority.key();
        event_factory.treasury = ctx.accounts.treasury.key();
        event_factory.treasury_fee = treasury_fee;
        event_factory.event_count = 0;
        Ok(())
    }

    pub fn create_event(
        ctx: Context<CreateEvent>,
        name: String,
        symbol: String,
        uri: String,
        description: String,
        category: String,
        tickets_amount: u64,
        ticket_price: u64,
        sale_type: SaleType,
        reserve_price: u64,
        start_time: i64,
        duration: u64,
    ) -> Result<()> {
        let event_factory = &mut ctx.accounts.event_factory;
        let event_id = event_factory.event_count;
        event_factory.event_count += 1;

        // Create event PDA
        let event = &mut ctx.accounts.event;
        event.id = event_id;
        event.authority = ctx.accounts.creator.key();
        event.name = name.clone();
        event.description = description;
        event.category = category;
        event.tickets_amount = tickets_amount;
        event.ticket_price = ticket_price;
        event.sale_type = sale_type;
        event.reserve_price = reserve_price;
        event.start_time = start_time;
        event.duration = duration;
        event.tickets_sold = 0;
        event.total_tips = 0;
        event.highest_tipper = Pubkey::default();
        event.highest_tip_amount = 0;
        event.status = EventStatus::Created;
        event.mint = ctx.accounts.mint.key();
        event.metadata = ctx.accounts.metadata.key();
        event.master_edition = ctx.accounts.master_edition.key();

        // Create mint account
        let rent = Rent::get()?;
        let rent_lamports = rent.minimum_balance(82);

        let seeds = &[
            b"event",
            &event_id.to_le_bytes(),
            &[ctx.bumps.event],
        ];
        let signer = &[&seeds[..]];

        // Create mint account
        invoke_signed(
            &system_instruction::create_account(
                &ctx.accounts.creator.key(),
                &ctx.accounts.mint.key(),
                rent_lamports,
                82,
                &token::ID,
            ),
            &[
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.mint.to_account_info(),
            ],
            signer,
        )?;

        // Initialize mint
        token::initialize_mint(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::InitializeMint {
                    mint: ctx.accounts.mint.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                signer,
            ),
            0, // 0 decimals for NFT
            &event.key(),
            Some(&event.key()),
        )?;

        // Create metadata
        let creator = vec![
            mpl_token_metadata::state::Creator {
                address: ctx.accounts.creator.key(),
                verified: false,
                share: 100,
            },
        ];

        invoke_signed(
            &create_metadata_accounts_v3(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.mint.key(),
                event.key(),
                ctx.accounts.creator.key(),
                event.key(),
                name,
                symbol,
                uri,
                Some(creator),
                0, // seller fee basis points (0%)
                true,
                true,
                None,
                None,
                None,
            ),
            &[
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                event.to_account_info(),
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.token_metadata_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
            signer,
        )?;

        // Create master edition
        invoke_signed(
            &create_master_edition_v3(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.master_edition.key(),
                ctx.accounts.mint.key(),
                event.key(),
                event.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.creator.key(),
                Some(0), // Max supply of 0 means unlimited
            ),
            &[
                ctx.accounts.master_edition.to_account_info(),
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                event.to_account_info(),
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.token_metadata_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
            signer,
        )?;

        // Mint one token to the creator
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.creator_token_account.to_account_info(),
                    authority: event.to_account_info(),
                },
                signer,
            ),
            1, // Mint exactly 1 for an NFT
        )?;

        // Initialize ticket factory for this event
        let cpi_program = ctx.accounts.ticket_factory_program.to_account_info();
        let cpi_accounts = ticket_factory::cpi::accounts::Initialize {
            event: ctx.accounts.event.to_account_info(),
            ticket_factory: ctx.accounts.ticket_factory.to_account_info(),
            authority: ctx.accounts.creator.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        ticket_factory::cpi::initialize(cpi_ctx, event_id, tickets_amount, ticket_price)?;

        Ok(())
    }

    pub fn update_event_status(ctx: Context<UpdateEventStatus>, status: EventStatus) -> Result<()> {
        let event = &mut ctx.accounts.event;
        
        // Validate status transition
        match (event.status, status) {
            (EventStatus::Created, EventStatus::Live) => {
                // Check if current time is after start_time
                let clock = Clock::get()?;
                require!(
                    clock.unix_timestamp >= event.start_time,
                    EventFactoryError::EventNotStarted
                );
            },
            (EventStatus::Live, EventStatus::Completed) => {
                // Check if current time is after start_time + duration
                let clock = Clock::get()?;
                require!(
                    clock.unix_timestamp >= event.start_time + (event.duration as i64),
                    EventFactoryError::EventNotEnded
                );
            },
            _ => return Err(EventFactoryError::InvalidStatusTransition.into()),
        }

        event.status = status;
        Ok(())
    }

    pub fn add_content_to_event(
        ctx: Context<AddContentToEvent>,
        content_uri: String,
    ) -> Result<()> {
        let event = &mut ctx.accounts.event;
        
        // Only allow adding content if event is Live or Completed
        require!(
            event.status == EventStatus::Live || event.status == EventStatus::Completed,
            EventFactoryError::CannotAddContent
        );

        // Update metadata with new URI that includes the content
        let seeds = &[
            b"event",
            &event.id.to_le_bytes(),
            &[ctx.bumps.event],
        ];
        let signer = &[&seeds[..]];

        // Update metadata URI
        invoke_signed(
            &mpl_token_metadata::instruction::update_metadata_accounts_v2(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.metadata.key(),
                event.key(),
                None,
                None,
                Some(content_uri),
                None,
            ),
            &[
                ctx.accounts.metadata.to_account_info(),
                event.to_account_info(),
            ],
            signer,
        )?;

        Ok(())
    }

    pub fn finalize_event(ctx: Context<FinalizeEvent>) -> Result<()> {
        let event = &mut ctx.accounts.event;
        let event_factory = &ctx.accounts.event_factory;
        
        // Ensure event is completed
        require!(
            event.status == EventStatus::Completed,
            EventFactoryError::EventNotCompleted
        );

        // Ensure there were tips
        require!(
            event.total_tips > 0,
            EventFactoryError::NoTips
        );

        // Calculate fee amount (10%)
        let fee_amount = event.total_tips.checked_mul(event_factory.treasury_fee)
            .ok_or(EventFactoryError::CalculationError)?
            .checked_div(1000)
            .ok_or(EventFactoryError::CalculationError)?;
        
        // Calculate artist amount (90%)
        let artist_amount = event.total_tips.checked_sub(fee_amount)
            .ok_or(EventFactoryError::CalculationError)?;

        // Transfer fee to treasury
        let ix = system_instruction::transfer(
            &ctx.accounts.event.key(),
            &event_factory.treasury,
            fee_amount,
        );
        invoke_signed(
            &ix,
            &[
                ctx.accounts.event.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[&[
                b"event",
                &event.id.to_le_bytes(),
                &[ctx.bumps.event],
            ]],
        )?;

        // Transfer artist amount to creator
        let ix = system_instruction::transfer(
            &ctx.accounts.event.key(),
            &event.authority,
            artist_amount,
        );
        invoke_signed(
            &ix,
            &[
                ctx.accounts.event.to_account_info(),
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[&[
                b"event",
                &event.id.to_le_bytes(),
                &[ctx.bumps.event],
            ]],
        )?;

        // Transfer NFT to highest tipper if there is one
        if event.highest_tipper != Pubkey::default() {
            // Create token account for highest tipper if it doesn't exist
            if ctx.accounts.highest_tipper_token_account.data_is_empty() {
                let cpi_accounts = anchor_spl::associated_token::Create {
                    payer: ctx.accounts.creator.to_account_info(),
                    associated_token: ctx.accounts.highest_tipper_token_account.to_account_info(),
                    authority: ctx.accounts.highest_tipper.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                };
                let cpi_program = ctx.accounts.associated_token_program.to_account_info();
                let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
                anchor_spl::associated_token::create(cpi_ctx)?;
            }

            // Transfer NFT to highest tipper
            let seeds = &[
                b"event",
                &event.id.to_le_bytes(),
                &[ctx.bumps.event],
            ];
            let signer = &[&seeds[..]];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    token::Transfer {
                        from: ctx.accounts.creator_token_account.to_account_info(),
                        to: ctx.accounts.highest_tipper_token_account.to_account_info(),
                        authority: ctx.accounts.creator.to_account_info(),
                    },
                    signer,
                ),
                1, // Transfer 1 NFT
            )?;
        }

        // Mark event as finalized
        event.status = EventStatus::Finalized;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 8
    )]
    pub event_factory: Account<'info, EventFactory>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: This is the treasury account that will receive fees
    pub treasury: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateEvent<'info> {
    #[account(mut)]
    pub event_factory: Account<'info, EventFactory>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + 8 + 32 + 64 + 256 + 64 + 8 + 8 + 1 + 8 + 8 + 8 + 8 + 32 + 8 + 1 + 32 + 32 + 32,
        seeds = [b"event", &event_factory.event_count.to_le_bytes()],
        bump
    )]
    pub event: Account<'info, Event>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    /// CHECK: This is the mint account that will be initialized
    #[account(mut)]
    pub mint: AccountInfo<'info>,
    
    /// CHECK: This is the metadata account that will be created
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    
    /// CHECK: This is the master edition account that will be created
    #[account(mut)]
    pub master_edition: AccountInfo<'info>,
    
    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = creator
    )]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: This is the ticket factory account that will be initialized
    #[account(mut)]
    pub ticket_factory: AccountInfo<'info>,
    
    /// CHECK: This is the ticket factory program
    pub ticket_factory_program: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    
    /// CHECK: This is the token metadata program
    pub token_metadata_program: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateEventStatus<'info> {
    #[account(
        mut,
        seeds = [b"event", &event.id.to_le_bytes()],
        bump,
        constraint = event.authority == creator.key()
    )]
    pub event: Account<'info, Event>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddContentToEvent<'info> {
    #[account(
        mut,
        seeds = [b"event", &event.id.to_le_bytes()],
        bump,
        constraint = event.authority == creator.key()
    )]
    pub event: Account<'info, Event>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    /// CHECK: This is the metadata account that will be updated
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    
    /// CHECK: This is the token metadata program
    pub token_metadata_program: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeEvent<'info> {
    pub event_factory: Account<'info, EventFactory>,
    
    #[account(
        mut,
        seeds = [b"event", &event.id.to_le_bytes()],
        bump,
        constraint = event.authority == creator.key()
    )]
    pub event: Account<'info, Event>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    /// CHECK: This is the treasury account that will receive fees
    #[account(mut, address = event_factory.treasury)]
    pub treasury: AccountInfo<'info>,
    
    /// CHECK: This is the mint account for the event NFT
    #[account(address = event.mint)]
    pub mint: AccountInfo<'info>,
    
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = creator
    )]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: This is the highest tipper account
    #[account(mut, address = event.highest_tipper)]
    pub highest_tipper: AccountInfo<'info>,
    
    /// CHECK: This is the highest tipper token account
    #[account(mut)]
    pub highest_tipper_token_account: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct EventFactory {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub treasury_fee: u64, // Fee in basis points (e.g., 100 = 10%)
    pub event_count: u64,
}

#[account]
pub struct Event {
    pub id: u64,
    pub authority: Pubkey,
    pub name: String,
    pub description: String,
    pub category: String,
    pub tickets_amount: u64,
    pub ticket_price: u64,
    pub sale_type: SaleType,
    pub reserve_price: u64,
    pub start_time: i64,
    pub duration: u64,
    pub tickets_sold: u64,
    pub total_tips: u64,
    pub highest_tipper: Pubkey,
    pub highest_tip_amount: u64,
    pub status: EventStatus,
    pub mint: Pubkey,
    pub metadata: Pubkey,
    pub master_edition: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum SaleType {
    CumulativeTips,
    BlindAuction,
    QuadraticTipping,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EventStatus {
    Created,
    Live,
    Completed,
    Finalized,
}

#[error_code]
pub enum EventFactoryError {
    #[msg("Event has not started yet")]
    EventNotStarted,
    #[msg("Event has not ended yet")]
    EventNotEnded,
    #[msg("Invalid status transition")]
    InvalidStatusTransition,
    #[msg("Cannot add content in current status")]
    CannotAddContent,
    #[msg("Event is not completed")]
    EventNotCompleted,
    #[msg("No tips received for this event")]
    NoTips,
    #[msg("Calculation error")]
    CalculationError,
}

// CPI interface for TicketFactory
#[interface]
pub trait TicketFactory {
    fn initialize(ctx: Context<Initialize>, event_id: u64, tickets_amount: u64, ticket_price: u64) -> Result<()>;
}
