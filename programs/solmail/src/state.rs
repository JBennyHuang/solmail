use anchor_lang::prelude::*;

#[account]
pub struct User {
    pub address: Pubkey,
    pub dh_key: String,
    pub bump: u8,
}

impl User {
    pub const SIZE: usize = 32 + (64 + 4) + 1;

    pub fn register(&mut self, address: Pubkey, dh_key: String, bump: u8) -> Result<()> {
        self.address = address;
        self.dh_key = dh_key;
        self.bump = bump;

        Ok(())
    }
}

#[account]
pub struct Message {
    pub from: Pubkey,
    pub to: Pubkey,
    pub message: String,
    pub created_at: u32,
    pub iv: String,
    pub salt: String,
}

impl Message {
    pub const SIZE: usize = 32 + 32 + (512 + 4) + 4 + 20 + 36;

    pub fn send(
        &mut self,
        from: Pubkey,
        to: Pubkey,
        message: String,
        iv: String,
        salt: String,
    ) -> Result<()> {
        self.from = from;
        self.to = to;
        self.message = message;
        self.created_at = Clock::get().unwrap().unix_timestamp as u32;
        self.iv = iv;
        self.salt = salt;

        emit!(NewMessageEvent { from, to });

        Ok(())
    }
}

#[event]
pub struct NewMessageEvent {
    pub from: Pubkey,
    pub to: Pubkey,
}
