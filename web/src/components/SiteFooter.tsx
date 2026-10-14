export default function SiteFooter({ left, right }: { left: string; right: string }) {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </footer>
  );
}
