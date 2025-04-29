use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::instruction::{create_metadata_accounts_v3, create_master_edition_v3};
use solana_program::program::invoke_signed;
use solana_program::system_instruction;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnT"); // Replace with your program ID

#[program]
pub mod ticket_factory {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        event_id: u64,
        tickets_amount: u64,
        ticket_price: u64,
    ) -> Result<()> {
        let ticket_factory = &mut ctx.accounts.ticket_factory;
        ticket_factory.event = ctx.accounts.event.key();
        ticket_factory.authority = ctx.accounts.authority.key();
        ticket_factory.tickets_amount = tickets_amount;
        ticket_factory.ticket_price = ticket_price;
        ticket_factory.tickets_sold = 0;
        ticket_factory.ticket_count = 0;
        Ok(())
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>, event_id: u64) -> Result<()> {
        let ticket_factory = &mut ctx.accounts.ticket_factory;
        let event = &mut ctx.accounts.event;
        
        // Check if tickets are still available
        require!(
            ticket_factory.tickets_amount == 0 || ticket_factory.tickets_sold < ticket_factory.tickets_amount,
            TicketFactoryError::SoldOut
        );
        
        // Check if event has not started yet
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp < event.start_time,
            TicketFactoryError::EventAlreadyStarted
        );
        
        // Check if payment is correct
        require!(
            ctx.accounts.payment.lamports() >= ticket_factory.ticket_price,
            TicketFactoryError::InsufficientPayment
        );
        
        // Transfer payment to event account
        let ix = system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &event.key(),
            ticket_factory.ticket_price,
        );
        invoke_signed(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                event.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;
        
        // Create ticket NFT
        let ticket_id = ticket_factory.ticket_count;
        ticket_factory.ticket_count += 1;
        ticket_factory.tickets_sold += 1;
        event.tickets_sold += 1;
        
        // Create ticket PDA
        let ticket = &mut ctx.accounts.ticket;
        ticket.id = ticket_id;
        ticket.event_id = event_id;
        ticket.owner = ctx.accounts.buyer.key();
        ticket.mint = ctx.accounts.mint.key();
        ticket.metadata = ctx.accounts.metadata.key();
        ticket.master_edition = ctx.accounts.master_edition.key();
        
        // Create mint account
        let rent = Rent::get()?;
        let rent_lamports = rent.minimum_balance(82);
        
        let seeds = &[
            b"ticket",
            &event_id.to_le_bytes(),
            &ticket_id.to_le_bytes(),
            &[ctx.bumps.ticket],
        ];
        let signer = &[&seeds[..]];
        
        // Create mint account
        invoke_signed(
            &system_instruction::create_account(
                &ctx.accounts.buyer.key(),
                &ctx.accounts.mint.key(),
                rent_lamports,
                82,
                &token::ID,
            ),
            &[
                ctx.accounts.buyer.to_account_info(),
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
            &ticket.key(),
            Some(&ticket.key()),
        )?;
        
        // Create metadata
        let event_name = event.name.clone();
        let ticket_name = format!("Ticket #{} for {}", ticket_id, event_name);
        let symbol = "TICKET".to_string();
        let uri = format!("https://haus.art/tickets/{}/{}", event_id, ticket_id);
        
        let creator = vec![
            mpl_token_metadata::state::Creator {
                address: event.key(),
                verified: false,
                share: 100,
            },
        ];
        
        invoke_signed(
            &create_metadata_accounts_v3(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.mint.key(),
                ticket.key(),
                ctx.accounts.buyer.key(),
                ticket.key(),
                ticket_name,
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
                ticket.to_account_info(),
                ctx.accounts.buyer.to_account_info(),
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
                ticket.key(),
                ticket.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.buyer.key(),
                Some(1), // Max supply of 1
            ),
            &[
                ctx.accounts.master_edition.to_account_info(),
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                ticket.to_account_info(),
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.token_metadata_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
            signer,
        )?;
        
        // Mint one token to the buyer
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
                    authority: ticket.to_account_info(),
                },
                signer,
            ),
            1, // Mint exactly 1 for an NFT
        )?;
        
        Ok(())
    }

    pub fn verify_ticket(ctx: Context<VerifyTicket>, event_id: u64, ticket_id: u64) -> Result<()> {
        let ticket = &ctx.accounts.ticket;
        let event = &ctx.accounts.event;
        
        // Check if ticket belongs to the event
        require!(
            ticket.event_id == event_id,
            TicketFactoryError::InvalidTicket
        );
        
        // Check if ticket belongs to the owner
        require!(
            ticket.owner == ctx.accounts.owner.key(),
            TicketFactoryError::NotTicketOwner
        );
        
        // Check if event is live
        require!(
            event.status == 1, // EventStatus::Live
            TicketFactoryError::EventNotLive
        );
        
        // Ticket is valid, no need to modify any state
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK: This is the event account
    pub event: AccountInfo<'info>,
      {
    /// CHECK: This is the event account
    pub event: AccountInfo<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8
    )]
    pub ticket_factory: Account<'info, TicketFactory>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(
        mut,
        constraint = ticket_factory.event == event.key()
    )]
    pub ticket_factory: Account<'info, TicketFactory>,
    
    /// CHECK: This is the event account
    #[account(mut)]
    pub event: AccountInfo<'info>,
    
    #[account(
        init,
        payer = buyer,
        space = 8 + 8 + 8 + 32 + 32 + 32 + 32,
        seeds = [b"ticket", &event_id.to_le_bytes(), &ticket_factory.ticket_count.to_le_bytes()],
        bump
    )]
    pub ticket: Account<'info, Ticket>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: This is the payment account
    #[account(mut)]
    pub payment: AccountInfo<'info>,
    
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
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    
    /// CHECK: This is the token metadata program
    pub token_metadata_program: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct VerifyTicket<'info> {
    /// CHECK: This is the event account
    pub event: AccountInfo<'info>,
    
    #[account(
        seeds = [b"ticket", &event_id.to_le_bytes(), &ticket_id.to_le_bytes()],
        bump,
        constraint = ticket.event_id == event_id
    )]
    pub ticket: Account<'info, Ticket>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct TicketFactory {
    pub event: Pubkey,
    pub authority: Pubkey,
    pub tickets_amount: u64,
    pub ticket_price: u64,
    pub tickets_sold: u64,
    pub ticket_count: u64,
}

#[account]
pub struct Ticket {
    pub id: u64,
    pub event_id: u64,
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub metadata: Pubkey,
    pub master_edition: Pubkey,
}

#[error_code]
pub enum TicketFactoryError {
    #[msg("Sold out")]
    SoldOut,
    #[msg("Event has already started")]
    EventAlreadyStarted,
    #[msg("Insufficient payment")]
    InsufficientPayment,
    #[msg("Invalid ticket")]
    InvalidTicket,
    #[msg("Not ticket owner")]
    NotTicketOwner,
    #[msg("Event is not live")]
    EventNotLive,
}
