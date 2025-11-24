import Link from 'next/link'

export default function NotFound() {
    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center h-screen">
                    <h2 className="text-2xl font-bold">Not Found</h2>
                    <p className="mb-4">Could not find requested resource</p>
                    <Link href="/" className="text-blue-500 hover:underline">Return Home</Link>
                </div>
            </body>
        </html>
    )
}
