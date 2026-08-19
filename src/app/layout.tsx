export default function RootLayout({
    children,
    header,
    footer,
}: Readonly<{
    children: React.ReactNode;
    header: React.ReactNode;
    footer: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body>
                <div>{header}</div>
                {children}
                <div>{footer}</div>
            </body>
        </html>
    );
}