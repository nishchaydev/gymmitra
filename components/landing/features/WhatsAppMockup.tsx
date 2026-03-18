"use client"

import { CheckCheck, MoreVertical, Phone, Video, ChevronLeft } from "lucide-react"
import { MOCKUP_DATA } from "@/lib/showcase-data"

export function WhatsAppMockup() {
    const data = MOCKUP_DATA.whatsapp

    return (
        <div className="w-full max-w-sm mx-auto bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border-[6px] border-slate-900 relative">
            {/* iOS Status Bar */}
            <div className="bg-[#f0f2f5] h-7 w-full flex justify-between items-center px-6 text-[10px] font-semibold text-slate-800 z-20">
                <span>9:41</span>
                <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 bg-slate-800 rounded-full opacity-20" />
                    <div className="h-2.5 w-2.5 bg-slate-800 rounded-full opacity-20" />
                    <div className="h-2.5 w-4 bg-slate-800 rounded-lg" />
                </div>
            </div>

            {/* Header */}
            <div className="bg-[#f0f2f5] px-4 py-3 flex items-center justify-between border-b border-slate-200/60 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <ChevronLeft className="h-6 w-6 text-[#007AFF]" />
                    <div className="relative">
                        <div className="h-9 w-9 bg-gradient-to-br from-[#25D366] to-[#1FA855] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                            GM
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 h-3 w-3 rounded-full border-[1.5px] border-white" />
                    </div>
                    <div className="flex flex-col">
                        <div className="font-semibold text-sm text-slate-900 flex items-center gap-1">
                            GymMitra
                            <span className="flex h-3 w-3 bg-[#25D366] rounded-full items-center justify-center">
                                <CheckCheck className="h-2 w-2 text-white" />
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-500">Official Business Account</div>
                    </div>
                </div>
                <div className="flex gap-4 text-[#007AFF]">
                    <Video className="h-5 w-5" />
                    <Phone className="h-5 w-5" />
                </div>
            </div>

            {/* Chat Area */}
            <div className="bg-[#EFE7DE] h-[340px] p-4 flex flex-col gap-4 overflow-hidden relative">
                {/* Wallpaper Pattern */}
                <div className="absolute inset-0 opacity-[0.4] bg-[url('https://camo.githubusercontent.com/c63266bb6c3a5099309228de6841793132bf52a659cc602df015a97561becc87/68747470733a2f2f7765622e77686174736170702e636f6d2f696d672f62672d636861742d74696c652d6461726b5f61346265353132653731393562366237333364393131306234303866303735642e706e67')] bg-repeat" style={{ filter: 'invert(1) opacity(0.1)' }} />

                {/* Date Bubble */}
                <div className="flex justify-center z-10 my-2">
                    <span className="bg-[#e4e4e4]/80 backdrop-blur-sm text-slate-600 text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm">
                        Today
                    </span>
                </div>

                {/* Message 1 (Automated) */}
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] self-start z-10 relative group">
                    <p className="text-[13px] text-slate-800 leading-snug">
                        Hi {data.memberName}! 👋 <br /><br />
                        Your membership expires in <span className="font-bold text-red-500">{data.daysRemaining} days</span>. Renew now to keep your streak!
                    </p>
                    <div className="text-[10px] text-slate-400 text-right mt-1">{data.time}</div>
                </div>

                {/* Message 2 (Rich Media Link) */}
                <div className="bg-white p-2 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] self-start z-10 relative">
                    <div className="bg-slate-50 rounded-xl overflow-hidden mb-2 border border-slate-100">
                        <div className="bg-[#25D366]/10 p-3 flex items-center gap-3">
                            <div className="h-8 w-8 bg-[#25D366] rounded-lg flex items-center justify-center text-white font-bold text-xs">₹</div>
                            <div>
                                <div className="text-xs font-bold text-[#1c9e52]">Payment Link</div>
                                <div className="text-[10px] text-slate-400">{data.paymentLink}</div>
                            </div>
                        </div>
                    </div>
                    <div className="text-[13px] text-[#007AFF] px-1 pb-1 font-medium cursor-pointer">
                        Tap to Pay Securely
                    </div>
                    <div className="text-[10px] text-slate-400 text-right mt-1">{data.time}</div>
                </div>

                {/* Message 3 (User Reply) */}
                <div className="bg-[#DCF8C6] p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] self-end z-10">
                    <p className="text-[13px] text-slate-800">
                        Done! ✅ Thanks.
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-[#5e8e7b]">10:32 AM</span>
                        <CheckCheck className="h-3.5 w-3.5 text-[#34B7F1]" />
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-[#f0f2f5] p-3 pb-5 flex items-center gap-3 border-t border-slate-200">
                <div className="h-8 w-8 text-[#007AFF] flex items-center justify-center">
                    <span className="text-2xl pb-1">+</span>
                </div>
                <div className="flex-1 bg-white h-9 rounded-full px-4 text-sm flex items-center text-slate-400 border border-slate-200 shadow-sm">
                    Message
                </div>
                <div className="h-8 w-8 text-[#007AFF] flex items-center justify-center">
                    <CameraIcon />
                </div>
                <div className="h-8 w-8 text-[#007AFF] flex items-center justify-center">
                    <MicIcon />
                </div>
            </div>
        </div>
    )
}

function CameraIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
    )
}

function MicIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
    )
}
