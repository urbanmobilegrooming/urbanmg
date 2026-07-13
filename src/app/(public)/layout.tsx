// Root passthrough layout for the (public) route group.
// Page-specific chrome (header/footer) lives in nested route groups
// like (public)/(landing) so utility pages (checkin/sign/etc) can render
// full-screen without the marketing chrome wrapping them.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
