import { createExecuteSaleInstruction } from "@metaplex-foundation/mpl-auction-house";
import {
  SELLERKEY,
  WRAPPED_SOL_MINT,
  AUCTION_HOUSE_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
  TOKEN_PROGRAM,
  SYSTEM_PROGRAM,
  RENT,
} from "./constants.js";
import pack from "@solana/web3.js";
import pkg from "@project-serum/anchor";
const { BN } = pkg;
import { getAssociatedTokenAddress,ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';
const { Connection, clusterApiUrl, Keypair, PublicKey, web3, Transaction } =
  pack;

const connection = new Connection(clusterApiUrl("devnet"));

const sellerFeeBasisPoints = 1000;

const wallet = Keypair.fromSecretKey(Uint8Array.from(SELLERKEY));

const treasuryWithdrawalDestination = wallet.publicKey;

const feeWithdrawalDestination = wallet.publicKey;
const auctionHouse = new PublicKey(
  "7jffDyhmwo12AwcnJPLAPC9qQCp2mMH1HdcrsWrXtyrb"
);
const treasuryMint = WRAPPED_SOL_MINT;
const mint = new PublicKey("BeW8fqPyFYQvy3SxjFW3Tpbf79NvinBFHHAxmNbfeDpt");
const twdAta = await getAssociatedTokenAddress(treasuryMint, wallet.publicKey);

const buyerKey = [
    139, 246, 0, 124, 30, 207, 79, 213, 87, 142, 69, 31, 0, 83, 76, 153, 184, 211,
    240, 57, 40, 4, 38, 225, 220, 94, 47, 40, 16, 217, 82, 167, 87, 90, 70, 81,
    27, 62, 106, 242, 54, 191, 179, 11, 95, 164, 80, 84, 30, 12, 65, 95, 254, 165,
    155, 78, 181, 186, 13, 112, 240, 127, 196, 31,
  ];
  const buyer = Keypair.fromSecretKey(Uint8Array.from(buyerKey));

const tokenAccountAddress = await getAssociatedTokenAddress(
  mint,
  wallet.publicKey
);

//   const [auctionHouse, ahBump] = await PublicKey.findProgramAddress(
//     [
//       Buffer.from("auction_house"),
//       wallet.publicKey.toBuffer(),
//       treasuryMint.toBuffer(),
//     ],
//     AUCTION_HOUSE_PROGRAM_ID
//   );

const [feeAccount, feeBump] = await PublicKey.findProgramAddress(
  [
    Buffer.from("auction_house"),
    auctionHouse.toBuffer(),
    Buffer.from("fee_payer"),
  ],
  AUCTION_HOUSE_PROGRAM_ID
);

const [treasuryAccount, treasuryBump] = await PublicKey.findProgramAddress(
  [
    Buffer.from("auction_house"),
    auctionHouse.toBuffer(),
    Buffer.from("treasury"),
  ],
  AUCTION_HOUSE_PROGRAM_ID
);
const metadata = await anchor.web3.PublicKey.findProgramAddress(
  [
    Buffer.from("metadata"),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
  ],
  TOKEN_METADATA_PROGRAM_ID
);
async function getAuctionHouseTradeState( 
    auctionHouse, 
    wallet, 
    tokenAccount, 
    treasuryMint, 
    tokenMint, 
    tokenSize, 
    buyPrice 
  ) { 
    return await PublicKey.findProgramAddress( 
      [ 
        Buffer.from('auction_house'), 
        wallet.toBuffer(), 
        auctionHouse.toBuffer(), 
        tokenAccount.toBuffer(), 
        treasuryMint.toBuffer(), 
        tokenMint.toBuffer(), 
        new BN(buyPrice).toArrayLike(Buffer, "le", 8), 
        
        new BN(tokenSize).toArrayLike(Buffer, "le", 8), 
      ], 
      AUCTION_HOUSE_PROGRAM_ID 
    ); 
  }

  const [sellerTradeState, tradeBump] = await getAuctionHouseTradeState(
    auctionHouse,
    wallet.publicKey,
    tokenAccountAddress,
    WRAPPED_SOL_MINT,
    mint,
    1,
    1,
  );
const [freeTradeState, freeTradeBump] = await getAuctionHouseTradeState(
  auctionHouse,
  wallet.publicKey,
  tokenAccountAddress,
  WRAPPED_SOL_MINT,
  mint,
  1,
  "0"
);
const buyerTradeState = await PublicKey.findProgramAddress(
    [
      Buffer.from("auction_house"),
      buyer.publicKey.toBuffer(),
      auctionHouse.toBuffer(),
      tokenAccountAddress.toBuffer(),
      WRAPPED_SOL_MINT.toBuffer(),
      mint.toBuffer(),
      new BN("1").toArrayLike(Buffer, "le", 8),
      new BN("1").toArrayLike(Buffer, "le", 8),
    ],
    AUCTION_HOUSE_PROGRAM_ID
  );
const feePayer = await PublicKey.findProgramAddress(
    [
    Buffer.from('auction_house'),
    auctionHouse.toBuffer(),
    Buffer.from('fee_payer'),
    ],
    AUCTION_HOUSE_PROGRAM_ID
);
const [signer, signerBump] = await PublicKey.findProgramAddress(
  [Buffer.from("auction_house"), Buffer.from("signer")],
  AUCTION_HOUSE_PROGRAM_ID
);
const buyerAssociatedAccount = await getAssociatedTokenAddress(
    mint,
    buyer.publicKey
  )
  const escrowPaymentAccount = await PublicKey.findProgramAddress(
    [
      Buffer.from("auction_house"),
      auctionHouse.toBuffer(),
      buyer.publicKey.toBuffer(),
    ],
    AUCTION_HOUSE_PROGRAM_ID
  );
const accounts = {
  
    buyer: buyer.publicKey,
    seller: wallet.publicKey,
    tokenAccount: tokenAccountAddress,
    tokenMint: mint,
    metadata: metadata[0],
    treasuryMint: WRAPPED_SOL_MINT,
    escrowPaymentAccount:escrowPaymentAccount[0] ,
    sellerPaymentReceiptAccount: wallet.publicKey,
    buyerReceiptTokenAccount: buyerAssociatedAccount,
    authority:new PublicKey("9eefy5AYPPE1MdftbK4XKBeK1Shwyt2oCauUvL8kKYKW"),
    
    auctionHouse: auctionHouse,
    auctionHouseFeeAccount: feePayer[0],
    auctionHouseTreasury: new PublicKey("HQjwCQ8WLPgsQ5UjshBv5uS9gMH8CidJrYvGiPr1WyZm"),
    buyerTradeState: buyerTradeState[0],
    sellerTradeState: sellerTradeState,
    freeTradeState: freeTradeState,
    programAsSigner: signer,
    anchorRemainingAccounts: [{pubkey: new PublicKey("J2wYmkdUgVZXVFfs7vrZuCpdrJy5Y4c4L4tcR4tjoLGT"),
      isWritable: true,
      isSigner: false,},
      {pubkey: new PublicKey("4L3oWp4ANModX1TspSSetKsB8HUu2TiBpuqj5FGJonAh"),
      isWritable: true,
      isSigner: false,}]
    
 
    // anchorRemainingAccounts?: web3.AccountMeta[];
  
   

};

// console.log("wallet",accounts);
// console.log("tokenAccount",wallet.publicKe.toBase58());



const args = {
    escrowPaymentBump:escrowPaymentAccount[1],

  freeTradeStateBump: freeTradeBump,
  programAsSignerBump: signerBump,
  buyerPrice: new BN(1),
  tokenSize: new BN(1),
};
// console.log("args",args);

const AH = createExecuteSaleInstruction(accounts, args);

let ix = new Transaction();
ix.add(AH);
ix.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
ix.feePayer = wallet.publicKey;

ix.sign(wallet);

const sign = await connection.sendRawTransaction(ix.serialize());

const tra = await connection.confirmTransaction(sign, "confirmed");
console.log(tra);
