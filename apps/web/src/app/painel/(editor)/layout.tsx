/** Editor de projeto: tela cheia, sem a barra lateral (como no protótipo). */
export default function EditorLayout({ children }: LayoutProps<'/painel'>) {
  return <div className="min-h-dvh bg-ink">{children}</div>;
}
