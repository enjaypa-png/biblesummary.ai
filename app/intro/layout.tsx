export default function IntroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-black" style={{ paddingBottom: 0 }}>
      {children}
    </div>
  );
}
