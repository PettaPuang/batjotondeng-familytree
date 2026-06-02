export default async function SilsilahLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="h-svh overflow-hidden">{children}</div>
}
