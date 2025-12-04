import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/layout/header";
import { Globe, Mail } from "lucide-react";

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-background">
            <div className="lg:mx-16 m-4 md:m-8">
                <Header />
                <div className="py-12 md:py-24 grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">

                    <div className="space-y-8">
                        <h1 className="text-4xl md:text-6xl font-bold">
                            Get in <span className="text-primary">Touch</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Have a question, suggestion, or just want to say hi? We'd love to hear from you.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-full text-primary">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Email Us</h3>
                                    <p className="text-muted-foreground">davidamzou@gmail.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-full text-primary">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Visit My Website</h3>
                                    <p className="text-muted-foreground">
                                        <a href="https://davamz.com" target="_blank" rel="noopener noreferrer">https://davamz.com</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border/50 p-8 rounded-3xl shadow-sm">
                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">First Name</label>
                                    <Input placeholder="John" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Last Name</label>
                                    <Input placeholder="Doe" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input type="email" placeholder="john@example.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <Textarea placeholder="How can we help you?" className="min-h-[150px]" />
                            </div>
                            <Button className="w-full rounded-full" size="lg">Send Message</Button>
                        </form>
                    </div>

                </div>
            </div>
        </main>
    );
}
