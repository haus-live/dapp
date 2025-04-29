"use client"

import { Navbar } from "@/components/navbar"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { QuickAccess } from "@/components/quick-access"
import { WalletDelegationSettings } from "@/components/wallet-delegation-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, ExternalLink, Wallet, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react"

export default function WalletPage() {
  return (
    <div className="min-h-screen flex flex-col texture-bg">
      <Navbar />
      <QuickAccess />

      <main className="flex-1 container py-12">
        <Breadcrumbs items={[{ label: "Profile", href: "/profile" }, { label: "Wallet" }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wallet</h1>
          <p className="text-muted-foreground">
            Manage your wallet, view transactions, and configure delegation settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Wallet Address</p>
                    <div className="flex items-center">
                      <code className="bg-muted p-2 rounded text-sm flex-1 font-mono">0x1a2b3c4d5e6f7g8h9i0j</code>
                      <Button variant="ghost" size="icon" className="ml-2">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">0.83 SOL</span>
                      <Button size="sm" className="bg-primary text-primary-foreground">
                        Add Funds
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <Button variant="outline" size="sm">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                    <Button variant="outline" size="sm">
                      <ArrowDownRight className="h-4 w-4 mr-2" />
                      Receive
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Explorer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <WalletDelegationSettings />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="transactions">
              <TabsList className="w-full">
                <TabsTrigger value="transactions" className="flex-1">
                  <Clock className="h-4 w-4 mr-2" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="assets" className="flex-1">
                  <Wallet className="h-4 w-4 mr-2" />
                  Assets
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>View your recent blockchain activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          type: "Tip",
                          event: "Live Painting Session",
                          amount: "0.03 SOL",
                          date: "2 hours ago",
                          status: "Completed",
                        },
                        {
                          type: "Ticket Purchase",
                          event: "Poetry Night: Urban Verses",
                          amount: "0.02 SOL",
                          date: "Yesterday",
                          status: "Completed",
                        },
                        {
                          type: "Deposit",
                          event: "Add Funds",
                          amount: "0.33 SOL",
                          date: "3 days ago",
                          status: "Completed",
                        },
                      ].map((tx, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{tx.type}</p>
                            <p className="text-sm text-muted-foreground">{tx.event}</p>
                            <p className="text-xs text-muted-foreground">{tx.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{tx.amount}</p>
                            <p className="text-xs text-green-600">{tx.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assets" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Assets</CardTitle>
                    <CardDescription>View your NFTs and tokens</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          name: "Event Ticket #123",
                          type: "NFT",
                          event: "Poetry Night: Urban Verses",
                          image: "/placeholder.svg?height=100&width=100",
                        },
                        {
                          name: "Event Ticket #456",
                          type: "NFT",
                          event: "Comedy Night with John Doe",
                          image: "/placeholder.svg?height=100&width=100",
                        },
                      ].map((asset, index) => (
                        <div key={index} className="flex items-center p-4 border rounded-lg">
                          <div className="w-16 h-16 mr-4 rounded overflow-hidden">
                            <img
                              src={asset.image || "/placeholder.svg"}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-muted-foreground">{asset.type}</p>
                            <p className="text-xs text-muted-foreground">{asset.event}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
