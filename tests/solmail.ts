import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Solmail } from "../target/types/solmail";
import fs from "fs";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { expect } from "chai";
import AES from "crypto-js/aes";
import { enc, mode, lib } from "crypto-js";
import { ec } from "elliptic";
import { Keypair, PublicKey } from "@solana/web3.js";

const fromFile = (filePath: string): anchor.web3.Keypair => {
  const secretKeyString = fs.readFileSync(filePath, "utf8");
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return anchor.web3.Keypair.fromSecretKey(secretKey);
};

describe("solmail", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const ellipticCurve = new ec("curve25519");
  const userOneKeypair = ellipticCurve.genKeyPair();
  const userTwoKeypair = ellipticCurve.genKeyPair();
  const userOneDHKey = userOneKeypair.getPublic().encode("hex", true);
  const userTwoDHKey = userTwoKeypair.getPublic().encode("hex", true);
  const sharedSecret = userOneKeypair
    .derive(userTwoKeypair.getPublic())
    .toString("hex");

  const program = anchor.workspace.Solmail as Program<Solmail>;

  const getPDA = async (seed: string, owner: PublicKey) => {
    const [pda] = await PublicKey.findProgramAddress(
      [Buffer.from(seed), owner.toBuffer()],
      program.programId
    );

    return pda;
  };

  it("test register", async () => {
    const userOne = fromFile("user1.json");
    const userTwo = fromFile("user2.json");

    // await program.methods
    //   .registerUser(userOneDHKey)
    //   .accounts({
    //     owner: userOne.publicKey,
    //     user: await getPDA("user", userOne.publicKey),
    //   })
    //   .signers([userOne])
    //   .rpc();

    // await program.methods
    //   .registerUser(userTwoDHKey)
    //   .accounts({
    //     owner: userTwo.publicKey,
    //     user: await getPDA("user", userTwo.publicKey),
    //   })
    //   .signers([userTwo])
    //   .rpc();

    const users = await program.account.user.all();

    console.log(users);

    expect(users.length).to.equal(2);
  });

  it("test send message", async () => {
    const userOne = fromFile("user1.json");
    const userTwo = fromFile("user2.json");

    const messageKeypair = Keypair.generate();
    const plaintext = "test";

    let cipher = AES.encrypt(plaintext, sharedSecret, { mode: mode.CTR });

    await program.methods
      .sendMessage(
        userTwo.publicKey,
        cipher.ciphertext.toString(),
        cipher.iv.toString(),
        cipher.salt.toString()
      )
      .accounts({
        owner: userOne.publicKey,
        message: messageKeypair.publicKey,
      })
      .signers([userOne, messageKeypair])
      .rpc();

    const message = await program.account.message.fetch(
      messageKeypair.publicKey
    );

    expect(plaintext).to.equal(
      AES.decrypt(
        {
          ciphertext: enc.Hex.parse(message.message),
          iv: enc.Hex.parse(message.iv),
          salt: enc.Hex.parse(message.salt),
        } as lib.CipherParams,
        sharedSecret,
        { mode: mode.CTR }
      ).toString(enc.Utf8)
    );
  });

  // it("encryption/decryption test", async () => {
  //   const user1 = fromFile("user1.json");
  //   const user2 = fromFile("user2.json");

  //   const message = "Hello World!";
  //   const iv = randomBytes(16);

  //   const secretUser1ToUser2 = Buffer.from(
  //     await ed.getSharedSecret(
  //       Buffer.from(user1.secretKey.slice(0, 32)),
  //       user2.publicKey.toBuffer()
  //     )
  //   );

  //   const secretUser2ToUser1 = Buffer.from(
  //     await ed.getSharedSecret(
  //       Buffer.from(user2.secretKey.slice(0, 32)),
  //       user1.publicKey.toBuffer()
  //     )
  //   );

  //   expect(secretUser1ToUser2).deep.equal(secretUser2ToUser1);

  //   const emessage = encrypt(message, secretUser1ToUser2, iv);
  //   const dmessage = decrypt(emessage, secretUser2ToUser1, iv);

  //   expect(dmessage).equal(message);
  // });

  // it("create email test", async () => {
  //   const user1 = fromFile("user1.json");
  //   const user2 = fromFile("user2.json");

  //   const subject = "Hello World!";
  //   const body = "Hello World!";
  //   const iv = randomBytes(16);

  //   const secretUser1ToUser2 = Buffer.from(
  //     await ed.getSharedSecret(
  //       Buffer.from(user1.secretKey.slice(0, 32)),
  //       user2.publicKey.toBuffer()
  //     )
  //   );

  //   const secretUser2ToUser1 = Buffer.from(
  //     await ed.getSharedSecret(
  //       Buffer.from(user2.secretKey.slice(0, 32)),
  //       user1.publicKey.toBuffer()
  //     )
  //   );

  //   const email = anchor.web3.Keypair.generate();

  //   const esubject = encrypt(subject, secretUser1ToUser2, iv);
  //   const ebody = encrypt(body, secretUser1ToUser2, iv);

  //   await program.methods
  //     .createEmail(
  //       user1.publicKey,
  //       user2.publicKey,
  //       esubject,
  //       ebody,
  //       iv.toString("base64")
  //     )
  //     .accounts({
  //       email: email.publicKey,
  //       owner: user1.publicKey,
  //     })
  //     .signers([email, user1])
  //     .rpc();

  //   const emails = await program.account.email.all([
  //     { memcmp: { offset: 40, bytes: user2.publicKey.toBase58() } },
  //   ]);

  //   for (const email of emails) {
  //     console.log(email);
  //     // const _iv = Buffer.from(email.account.iv, "base64");
  //     // const dsubject = decrypt(email.account.subject, secretUser2ToUser1, iv);
  //     // const dbody = decrypt(email.account.body, secretUser2ToUser1, iv);
  //     // expect(dsubject).equal(subject);
  //     // expect(dbody).equal(body);
  //   }
  // });
});
