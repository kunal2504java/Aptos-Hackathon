import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";
export const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");
        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="px-2 py-3 bg-green-600 text-black rounded pixelated-border hover:bg-green-500 transition-colors flex items-center"
                  >
                    Connect Wallet
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="px-2 py-3 bg-red-600 text-black rounded pixelated-border hover:bg-red-500 transition-colors flex items-center"
                  >
                    Wrong network
                  </button>
                );
              }
              return (
                <div className="flex items-center gap-10">
                  <Link href="/markets/create">
                    <button
                      style={{ display: "flex", alignItems: "center" }}
                      type="button"
                      className="flex items-center gap-3 px-2 py-2  hover:text-black rounded pixelated-border hover:bg-yellow-500 transition-colors text-green-500"
                    >
                      Create Market
                    </button>
                  </Link>
                  <Link href="/markets/mymarkets">
                    <button
                      style={{ display: "flex", alignItems: "center" }}
                      type="button"
                      className="flex items-center gap-3 px-2 py-2  hover:text-black rounded pixelated-border hover:bg-yellow-500 transition-colors text-green-500"
                    >
                      My Markets
                    </button>
                  </Link>
                  <button
                    onClick={openChainModal}
                    style={{ display: "flex", alignItems: "center" }}
                    type="button"
                    className="flex items-center gap-3 px-2 py-2  hover:text-black rounded pixelated-border hover:bg-yellow-500 transition-colors text-green-500"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 30,
                          height: 30,
                          borderRadius: 999,
                          overflow: "hidden",
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <Image
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            style={{ width: 30, height: 30 }}
                            width={30}
                            height={30}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="px-2 py-3 bg-green-600 text-black rounded pixelated-border hover:bg-green-500 transition-colors flex items-center"
                  >
                    {account.displayName}
                    {account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ""}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
