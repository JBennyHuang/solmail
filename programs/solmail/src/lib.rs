pub mod error;
pub mod state;

use anchor_lang::prelude::*;
use state::{Message, User};

declare_id!("9s6iCh5fmBzGV8tc3ubiECvKy9cwarZvaGVbAaEb5uEc");

#[program]
pub mod solmail {
    use super::*;

    pub fn register_user(ctx: Context<RegisterUser>, dh_key: String) -> Result<()> {
        let address = *ctx.accounts.owner.key;
        let bump = *ctx.bumps.get("user").unwrap();

        ctx.accounts.user.register(address, dh_key, bump)
    }

    pub fn send_message(
        ctx: Context<SendMessage>,
        to: Pubkey,
        message: String,
        iv: String,
        salt: String,
    ) -> Result<()> {
        let from = *ctx.accounts.owner.key;

        ctx.accounts.message.send(from, to, message, iv, salt)
    }
}

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(init, payer=owner, space=8 + User::SIZE, seeds=[b"user", owner.key().as_ref()], bump)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SendMessage<'info> {
    #[account(init, payer=owner, space=8 + Message::SIZE)]
    pub message: Account<'info, Message>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
