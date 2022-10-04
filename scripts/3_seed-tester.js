const config = require('../src/config.json')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  // Fetch accounts from wallet - these are unlocked
  const accounts = await ethers.getSigners()

  // Fetch network
  const { chainId } = await ethers.provider.getNetwork()
  console.log("Using chainId:", chainId)

  // Fetch deployed tokens
  const TOKEN = await ethers.getContractAt('Token', config[chainId].TOKEN.address)
  console.log(`TOKEN Token fetched: ${TOKEN.address}\n`)

  const mETH = await ethers.getContractAt('Token', config[chainId].mETH.address)
  console.log(`mETH Token fetched: ${mETH.address}\n`)

  const mDAI = await ethers.getContractAt('Token', config[chainId].mDAI.address)
  console.log(`mDAI Token fetched: ${mDAI.address}\n`)

  // Fetch the deployed exchange
  const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address)
  console.log(`Exchange fetched: ${exchange.address}\n`)

  // Give tokens to TESTER
   const sender = accounts[0]
  // Tester's metamask wallet address
   const Tester = "0x9170b78B33A0dC78d1f62eeD46E1B224290D8156"

  let amountMeth = tokens(10000)
  let amountMdai = tokens(777)
  
  let transaction
  
  // SENDER transfers 10,000 mETH TO RECEIVER...
  transaction = await mETH.connect(sender).transfer(Tester, amountMeth)
  console.log(`Transferred ${amountMeth} tokens from ${sender.address} to ${Tester}\n`)

  // SENDER transfers 777 mDai  TO RECEIVER...
  transaction = await mDAI.connect(sender).transfer(Tester, amountMdai)
  console.log(`Transferred ${amountMdai} tokens from ${sender.address} to ${Tester}\n`)
  
  console.log("THE END")

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
