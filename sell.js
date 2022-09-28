import { createSellInstruction } from "@metaplex-foundation/mpl-auction-house";
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
import { getAssociatedTokenAddress } from "@solana/spl-token";
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

const accounts = {
  wallet: wallet.publicKey,
  tokenAccount: tokenAccountAddress,
  metadata: metadata[0],
  authority: wallet.publicKey,
 
  auctionHouse: auctionHouse,
  auctionHouseFeeAccount: new PublicKey(
    "9EW5yHSWkomLCSjFz1PGSF7ePnBVYLk4nPTiDXkT6Fa1"
  ),
  sellerTradeState: sellerTradeState,
  freeSellerTradeState: freeTradeState,
  // tokenProgram: TOKEN_PROGRAM,
  // systemProgram: SYSTEM_PROGRAM,
  programAsSigner: signer,
  // rent?: RENT,

};
console.log("wallet",auctionHouse.toBase58());
// console.log("tokenAccount",wallet.publicKe.toBase58());



const args = {
  tradeStateBump: tradeBump,
  freeTradeStateBump: freeTradeBump,
  programAsSignerBump: signerBump,
  buyerPrice: new BN(1),
  tokenSize: new BN(1),
};

const AH = createSellInstruction(accounts, args);

let ix = new Transaction();
ix.add(AH);
ix.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
ix.feePayer = wallet.publicKey;

ix.sign(wallet);

const sign = await connection.sendRawTransaction(ix.serialize());

const tra = await connection.confirmTransaction(sign, "confirmed");
console.log(tra);
