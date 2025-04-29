import { ethers } from "ethers"
import { CONTRACT_ADDRESSES, EVENT_FACTORY_ABI, TICKET_FACTORY_ABI, LIVE_TIPPING_ABI } from "./constants"
import { dateToUnixTimestamp } from "./alchemy"
import { uploadFileToIPFS, uploadMetadataToIPFS } from "./ipfs"
import { storeEventDetails, storeTicketPurchase, storeTip } from "./tableland"

// Create event on the blockchain
export const createEvent = async (
  provider: any,
  title: string,
  description: string,
  startDate: Date,
  duration: number, // in minutes
  maxTickets: number,
  ticketPrice: number, // in ETH
  banner: File | null,
  category: string,
): Promise<{ eventId: number; txHash: string }> => {
  try {
    if (!provider) throw new Error("No provider available")

    // Create a contract instance
    const eventFactoryInterface = new ethers.utils.Interface(EVENT_FACTORY_ABI)

    // Convert parameters to the format expected by the contract
    const startTime = dateToUnixTimestamp(startDate)
    const durationInSeconds = duration * 60 // Convert minutes to seconds
    const ticketPriceWei = ethers.utils.parseEther(ticketPrice.toString())

    // Upload banner to IPFS if provided
    let bannerCid = ""
    if (banner) {
      bannerCid = await uploadFileToIPFS(banner)
    }

    // Create metadata for the event NFT
    const metadata = {
      name: title,
      description,
      image: bannerCid ? `ipfs://${bannerCid}` : "ipfs://placeholder-default-image",
      attributes: [
        { trait_type: "Category", value: category },
        { trait_type: "Start Time", value: startDate.toISOString() },
        { trait_type: "Duration", value: `${duration} minutes` },
        { trait_type: "Max Tickets", value: maxTickets },
        { trait_type: "Ticket Price", value: `${ticketPrice} ETH` },
      ],
    }

    // Upload metadata to IPFS
    const metadataURI = await uploadMetadataToIPFS(metadata)

    // Encode the function call
    const data = eventFactoryInterface.encodeFunctionData("createEvent", [
      title,
      description,
      startTime,
      durationInSeconds,
      maxTickets,
      ticketPriceWei,
      `ipfs://${metadataURI}`,
    ])

    // Send the transaction
    const userOp = await provider.sendUserOperation({
      target: CONTRACT_ADDRESSES.EVENT_FACTORY,
      data,
      value: 0n,
    })

    // Wait for the transaction to be mined
    const txHash = await provider.waitForUserOperationTransaction(userOp.hash)

    // In a real implementation, we would extract the eventId from the transaction logs
    // For now, we'll just return a mock eventId
    const eventId = 1 // Mock value

    // Store event details in Tableland
    await storeEventDetails({
      event_id: eventId,
      creator_address: await provider.getAddress(),
      title,
      description,
      category,
      banner_cid: bannerCid,
      metadata_cid: metadataURI,
      start_time: startTime,
      duration: durationInSeconds,
      ticket_price: ticketPrice.toString(),
      max_tickets: maxTickets,
      sale_type: "cumulative-tips", // Default sale type
    })

    return {
      eventId,
      txHash,
    }
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

// Buy a ticket for an event
export const buyTicket = async (
  provider: any,
  eventId: number,
  ticketPrice: string, // in ETH
): Promise<{ txHash: string }> => {
  try {
    if (!provider) throw new Error("No provider available")

    // Create a contract instance
    const ticketFactoryInterface = new ethers.utils.Interface(TICKET_FACTORY_ABI)

    // Convert ticket price to wei
    const ticketPriceWei = ethers.utils.parseEther(ticketPrice)

    // Encode the function call
    const data = ticketFactoryInterface.encodeFunctionData("buyTicket", [eventId])

    // Send the transaction
    const userOp = await provider.sendUserOperation({
      target: CONTRACT_ADDRESSES.TICKET_FACTORY,
      data,
      value: BigInt(ticketPriceWei.toString()),
    })

    // Wait for the transaction to be mined
    const txHash = await provider.waitForUserOperationTransaction(userOp.hash)

    // Store ticket purchase in Tableland
    await storeTicketPurchase({
      event_id: eventId,
      owner_address: await provider.getAddress(),
      purchase_time: Math.floor(Date.now() / 1000),
      ticket_price: ticketPrice,
      tx_hash: txHash,
    })

    return {
      txHash,
    }
  } catch (error) {
    console.error("Error buying ticket:", error)
    throw error
  }
}

// Send a tip during an event
export const sendTip = async (
  provider: any,
  eventId: number,
  tipAmount: string, // in ETH
): Promise<{ txHash: string }> => {
  try {
    if (!provider) throw new Error("No provider available")

    // Create a contract instance
    const liveTippingInterface = new ethers.utils.Interface(LIVE_TIPPING_ABI)

    // Convert tip amount to wei
    const tipAmountWei = ethers.utils.parseEther(tipAmount)

    // Encode the function call
    const data = liveTippingInterface.encodeFunctionData("tipCreator", [eventId])

    // Send the transaction
    const userOp = await provider.sendUserOperation({
      target: CONTRACT_ADDRESSES.LIVE_TIPPING,
      data,
      value: BigInt(tipAmountWei.toString()),
    })

    // Wait for the transaction to be mined
    const txHash = await provider.waitForUserOperationTransaction(userOp.hash)

    // Store tip in Tableland
    await storeTip({
      event_id: eventId,
      tipper_address: await provider.getAddress(),
      tip_time: Math.floor(Date.now() / 1000),
      tip_amount: tipAmount,
      tx_hash: txHash,
    })

    return {
      txHash,
    }
  } catch (error) {
    console.error("Error sending tip:", error)
    throw error
  }
}
