use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("SubjectEmptyError: subject must not be empty")]
    SubjectEmptyError,

    #[msg("SubjectTooLongError: subject must not exceed 64 bytes")]
    SubjectTooLongError,

    #[msg("BodyEmptyError: body must not be empty")]
    BodyEmptyError,

    #[msg("BodytError: body must not exceed 1024 bytes")]
    BodyTooLongError,

    #[msg("InitialVectorError: initial vector must be exactly 24 bytes")]
    InitialVectorError,
}
