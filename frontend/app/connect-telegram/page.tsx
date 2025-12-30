import { SimpleHeader } from "@/components/layout/simple-header"
import { Footer } from "@/components/layout/footer"
import { TelegramLink } from "@/components/dashboard/telegram-link"

export default function ConnectTelegramPage() {
    return (
        <div className="min-h-screen bg-navy cyber-grid">
            <SimpleHeader />
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    <TelegramLink />
                </div>
            </main>
            <Footer />
        </div>
    )
}
