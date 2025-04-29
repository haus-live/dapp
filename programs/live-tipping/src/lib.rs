use anchor_lang::prelude::*;
use solana_program::program::invoke_signed;
use solana_program::system_instruction;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnU"); // Replace with your program ID

#[program]
pub mod live_tipping {
    use super::*;

    pub fn tip_creator(ctx: Context<TipCreator>, event_id: u64, amount: u64) -> Result<()> {
        let event = &mut ctx.accounts.event;
        
        // Check if event is live
        require!(
            event.status == 1, // EventStatus::Live
            LiveTippingError::EventNotLive
        );
        
        // Check if tipper has a valid ticket
        // This would be done by verifying the ticket, but for simplicity we'll skip this check
        // In a production environment, you would want to verify the ticket ownership
        
        // Check if payment is sufficient
        require!(
            ctx.accounts.payment.lamports() >= amount,
            LiveTippingError::InsufficientPayment
        );
        
        // Transfer tip to event account
        let ix = system_instruction::transfer(
            &ctx.accounts.tipper.key(),
            &event.key(),
            amount,
        );
        invoke_signed(
            &ix,
            &[
                ctx.accounts.tipper.to_account_info(),
                event.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;
        
        // Update event state
        event.total_tips = event.total_tips.checked_add(amount)
            .ok_or(LiveTippingError::CalculationError)?;
        
        // Check if this is the highest tipper
        if amount > event.highest_tip_amount {
            event.highest_tipper = ctx.accounts.tipper.key();
            event.highest_tip_amount = amount;
        }
        
        // Create tip record
        let tip = &mut ctx.accounts.tip;
        tip.event_id = event_id;
        tip.tipper = ctx.accounts.tipper.key();
        tip.amount = amount;
        tip.timestamp = Clock::get()?.unix_timestamp;
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(event_id: u64, amount: u64)]
pub struct TipCreator<'info> {
    /// CHECK: This is the event account
    #[account(mut)]
    pub event: AccountInfo<'info>,
    
    #[account(
        init,
        payer = tipper,
        space = 8 + 8 + 32 + 8 + 8,
        seeds = [b"tip", &event_id.to_le_bytes(), &tipper.key().to_bytes()],
        bump
    )]
    pub tip: Account<'info, Tip>,
    
    #[account(mut)]
    pub tipper: Signer<'info>,
    
    /// CHECK: This is the payment account
    #[account(mut)]
    pub payment: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Tip {
    pub event_id: u64,
    pub tipper: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum LiveTippingError {
    #[msg("Event is not live")]
    EventNotLive,
    #[msg("Insufficient payment")]
    InsufficientPayment,
    #[msg("Calculation error")]
    CalculationError,
}
