const config = require('../src/config.json')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const wait = (seconds) => {
  const milliseconds = seconds * 1000
  return new Promise(resolve => setTimeout(resolve, milliseconds))
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

  // Give tokens to account[1]
  const sender = accounts[0]
  const receiver = accounts[1]
  const receiver2 = accounts[2]
  let amountMeth = tokens(10000)
  let amountMdai = tokens(777)
  
  let transaction, result
  
  // SENDER transfers 10,000 mETH TO RECEIVER...
  transaction = await mETH.connect(sender).transfer(receiver.address, amountMeth)
  console.log(`Transferred ${amountMeth} tokens from ${sender.address} to ${receiver.address}\n`)

  // SENDER transfers 10,000 mETH TO RECIEVER 2...
  transaction = await mETH.connect(sender).transfer(receiver2.address, amountMeth)
  console.log(`Transferred ${amountMeth} tokens from ${sender.address} to ${receiver2.address}\n`)

  // SENDER transfers 777 mDai  TO RECEIVER...
  transaction = await mDAI.connect(sender).transfer(receiver.address, amountMdai)
  console.log(`Transferred ${amountMdai} tokens from ${sender.address} to ${receiver.address}\n`)

  // SENDER transfers 777 mDai TO RECIEVER 2...
  transaction = await mDAI.connect(sender).transfer(receiver2.address, amountMdai)
  console.log(`Transferred ${amountMdai} tokens from ${sender.address} to ${receiver2.address}\n`)

  // Set up exchange users
  const user0 = accounts[0]
  const user1 = accounts[1]
  const user2 = accounts[2]
  const users = [user0, user1, user2]
  let amount = tokens(10000)
  let amount2 = tokens(333)  

  // user 0 approves 10,000 TOKEN...
  transaction = await TOKEN.connect(user0).approve(exchange.address, amount)
  await transaction.wait()
  console.log(`User 0 Approved ${amount} TOKEN from ${user0.address}`)
  // user 0 deposits 10,000 TOKEN...
  transaction = await exchange.connect(user0).depositToken(TOKEN.address, amount)
  await transaction.wait()
  console.log(`User 0 Deposited ${amount} TOKEN from ${user0.address}\n`)

  // User 1 Approves mETH
  transaction = await mETH.connect(user1).approve(exchange.address, amount)
  await transaction.wait()
  console.log(`User 1 Approved ${amount} mETH from ${user1.address}`)
  // User 1 Deposits mETH
  transaction = await exchange.connect(user1).depositToken(mETH.address, amount)
  await transaction.wait()
  console.log(`User 1 Deposited ${amount} mETH from ${user1.address}\n`)

  // User 2 Approves mETH
  transaction = await mETH.connect(user2).approve(exchange.address, amount)
  await transaction.wait()
  console.log(`User 2 Approved ${amount} mETH from ${user2.address}`)
  // User 2 Deposits mETH
  transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
  await transaction.wait()
  console.log(`User 2 Deposited ${amount} mETH from ${user2.address}\n`)


  for (let i = 0; i < 3; i++) {
  // User i Approves mDAI
    transaction = await mDAI.connect(users[i]).approve(exchange.address, amount2)
    await transaction.wait()
    console.log(`User ${i} Approved ${amount2} mDAI from ${users[i].address}`)
  // User i Deposits mDAI
    transaction = await exchange.connect(users[i]).depositToken(mDAI.address, amount2)
    await transaction.wait()
    console.log(`User ${i} Deposited ${amount2} mDAI from ${users[i].address}\n`)
  }

  /////////////////////////////////////////////////////////////
  // Seed a Cancelled Order
  //

  // User 0 makes order to get tokens
  let orderId
  transaction = await exchange.connect(user0).makeOrder(mETH.address, tokens(100), TOKEN.address, tokens(5))
  result = await transaction.wait()
  console.log(`Made order from ${user0.address}`)

  // User 0 cancels order
  orderId = result.events[0].args.id
  transaction = await exchange.connect(user0).cancelOrder(orderId)
  result = await transaction.wait()
  console.log(`Cancelled order from ${user0.address}\n`)

  // Wait 1 second
  await wait(1)

  /////////////////////////////////////////////////////////////
  // Seed Filled Orders
  //

  // User 0 makes SELL order
  transaction = await exchange.connect(user0).makeOrder(mETH.address, tokens(100), TOKEN.address, tokens(10))
  result = await transaction.wait()
  console.log(`Made order from ${user0.address}`)

  // User 1 fills order
  orderId = result.events[0].args.id
  transaction = await exchange.connect(user1).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled order from ${user0.address}\n`)

  // Wait 1 second
  await wait(1)

  // User 0 makes another order
  transaction = await exchange.makeOrder(mETH.address, tokens(50), TOKEN.address, tokens(15))
  result = await transaction.wait()
  console.log(`Made order from ${user0.address}`)

  // User 0 fills another order
  orderId = result.events[0].args.id
  transaction = await exchange.connect(user1).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled order from ${user0.address}\n`)

  // Wait 1 second
  await wait(1)

  // User 0 makes FILL order
  transaction = await exchange.connect(user0).makeOrder(mETH.address, tokens(200), TOKEN.address, tokens(20))
  result = await transaction.wait()
  console.log(`Made order from ${user0.address}`)

  // User 1 fills order
  orderId = result.events[0].args.id
  transaction = await exchange.connect(user1).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled order from ${user0.address}\n`)

  // User 0 makes FILL order
  transaction = await exchange.connect(user0).makeOrder(mETH.address, tokens(200), TOKEN.address, tokens(69))
  result = await transaction.wait()
  console.log(`Made order from ${user0.address}`)

  // User 2 fills order
  orderId = result.events[0].args.id
  transaction = await exchange.connect(user2).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`USER 2 Filled order from ${user0.address}\n`)

  // Wait 1 second
  await wait(1)

  /////////////////////////////////////////////////////////////
  // Seed Open Orders
  //

  // User 0 makes 10 SELL orders for mETH
  for(let i = 1; i <= 10; i++) {
    transaction = await exchange.connect(user0).makeOrder(mETH.address, tokens(10 * i), TOKEN.address, tokens(10))
    result = await transaction.wait()

    console.log(`Made order from ${user0.address}`)

    // Wait 1 second
    await wait(1)
  }

  // User 1 makes 10 BUY orders mETH
  for (let i = 1; i <= 10; i++) {
    transaction = await exchange.connect(user1).makeOrder(TOKEN.address, tokens(10), mETH.address, tokens(10 * i))
    result = await transaction.wait()

    console.log(`Made order from ${user1.address}`)

    // Wait 1 second
    await wait(1)
  }

  // User 2 makes 10 BUY orders for mDAI
  for (let i = 1; i <= 10; i++) {
    transaction = await exchange.connect(user2).makeOrder(TOKEN.address, tokens(7), mDAI.address, tokens(7 * i))
    result = await transaction.wait()

    console.log(`Made order from ${user2.address}`)

    // Wait 1 second
    await wait(1)
  }

  // User 1 makes 10 SELL orders for mDAI
  for(let i = 1; i <= 10; i++) {
    transaction = await exchange.connect(user1).makeOrder(mDAI.address, tokens(5 * i), TOKEN.address, tokens(5))
    result = await transaction.wait()

    console.log(`Made order from ${user1.address}`)

    // Wait 1 second
    await wait(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
