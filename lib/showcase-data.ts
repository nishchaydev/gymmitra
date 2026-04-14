// Enhanced Mock Data for Full App Showcase
// Centralized for both Landing Page Mockups and Dashboard Demo

export const SHOWCASE_STATS = {
    totalMembers: 1248,
    activeMembers: 954,
    totalRevenue: 425000,
    productSales: 342,
    revenueGrowth: "+12.5% from last month",
    memberGrowth: "+48 this week",
    expiringSoon: 12,
    recentInvoices: [
        { id: "inv1", member: { id: "m1", name: "Rahul Sharma" }, amount: 1500, status: "PAID", date: new Date(), type: "Membership" },
        { id: "inv2", member: { id: "m2", name: "Anjali Gupta" }, amount: 3000, status: "PAID", date: new Date(Date.now() - 3600000), type: "Membership" },
        { id: "inv3", member: { id: "m3", name: "Vikram Singh" }, amount: 1200, status: "PENDING", date: new Date(Date.now() - 7200000), type: "Product" },
        { id: "inv4", member: { id: "m4", name: "Priya Verma" }, amount: 4500, status: "PAID", date: new Date(Date.now() - 10800000), type: "Membership" },
        { id: "inv5", member: { id: "m5", name: "Amit Patel" }, amount: 1500, status: "PAID", date: new Date(Date.now() - 14400000), type: "Product" },
    ],
    overviewData: [
        { name: "Jan", total: 120000 },
        { name: "Feb", total: 180000 },
        { name: "Mar", total: 150000 },
        { name: "Apr", total: 220000 },
        { name: "May", total: 190000 },
        { name: "Jun", total: 280000 },
        { name: "Jul", total: 240000 },
        { name: "Aug", total: 320000 },
        { name: "Sep", total: 290000 },
        { name: "Oct", total: 380000 },
        { name: "Nov", total: 350000 },
        { name: "Dec", total: 425000 },
    ]
}

export const MOCKUP_DATA: any = {
    whatsapp: {
        memberName: "Rajesh",
        daysRemaining: 3,
        time: "10:30 AM",
        paymentLink: "secure.gym-mitra.com/pay/rx2k"
    },
    attendance: {
        logs: [
            { name: "Rahul Sharma", time: "10:42 AM", status: "granted", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul" },
            { name: "Priya Singh", time: "10:39 AM", status: "granted", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya" },
            { name: "Amit Patel", time: "10:35 AM", status: "granted", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit" },
            { name: "Vikram Singh", time: "10:30 AM", status: "denied", reason: "Expired", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram" },
        ]
    },
    memberApp: {
        memberName: "Arjun",
        planName: "Gold Annual",
        daysRemaining: 12,
        streak: 14,
        goalProgress: 85,
        img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun"
    },
    analytics: {
        memberGrowth: [
            { name: "Jan", members: 120 },
            { name: "Feb", members: 135 },
            { name: "Mar", members: 160 },
            { name: "Apr", members: 210 },
            { name: "May", members: 255 },
            { name: "Jun", members: 310 },
            { name: "Jul", members: 380 },
        ],
        attendance: [
            { name: "Mon", morning: 45, evening: 80 },
            { name: "Tue", morning: 50, evening: 95 },
            { name: "Wed", morning: 48, evening: 85 },
            { name: "Thu", morning: 60, evening: 90 },
            { name: "Fri", morning: 55, evening: 110 },
            { name: "Sat", morning: 70, evening: 60 },
            { name: "Sun", morning: 30, evening: 20 },
        ]
    },
    birthdays: [
        { name: "Rahul Sharma", date: "Today", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul" },
        { name: "Priya Singh", date: "Tomorrow", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya" },
        { name: "Amit Patel", date: "15 Feb", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit" },
    ]
}

export const SHOWCASE_MEMBERS = [
    { id: "m1", name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210", status: "ACTIVE", joiningDate: new Date("2024-01-15"), planName: "Premium Quarterly", endDate: new Date("2024-04-15"), gender: "MALE", dob: new Date("1995-05-20"), address: "123 Park Street, Delhi", gymId: "demo" },
    { id: "m2", name: "Anjali Gupta", email: "anjali@example.com", phone: "8877665544", status: "ACTIVE", joiningDate: new Date("2023-11-20"), planName: "Gold Annual", endDate: new Date("2024-11-20"), gender: "FEMALE", dob: new Date("1998-12-10"), address: "45-B Green Road, Mumbai", gymId: "demo" },
    { id: "m3", name: "Vikram Singh", email: "vikram@example.com", phone: "7766554433", status: "EXPIRED", joiningDate: new Date("2023-08-10"), planName: "Basic Monthly", endDate: new Date("2023-09-10"), gender: "MALE", dob: new Date("1990-03-15"), address: "Sector 15, Chandigarh", gymId: "demo" },
    { id: "m4", name: "Priya Verma", email: "priya@example.com", phone: "9988776655", status: "ACTIVE", joiningDate: new Date("2024-02-05"), planName: "Premium Quarterly", endDate: new Date("2024-05-05"), gender: "FEMALE", dob: new Date("1997-09-25"), address: "MG Road, Pune", gymId: "demo" },
    { id: "m5", name: "Amit Patel", email: "amit@example.com", phone: "9001122334", status: "ACTIVE", joiningDate: new Date("2024-02-01"), planName: "Gold Annual", endDate: new Date("2025-02-01"), gender: "MALE", dob: new Date("1992-07-08"), address: "654 River Side, Kolkata", gymId: "demo" },
]

export const SHOWCASE_PRODUCTS = [
    { id: "p1", name: "Whey Protein Isolate", category: "Supplements", price: 2500, stock: 45, sold: 120 },
    { id: "p2", name: "GymMitra T-Shirt", category: "Apparel", price: 499, stock: 100, sold: 50 },
    { id: "p3", name: "Pre-Workout Blaze", category: "Supplements", price: 1800, stock: 30, sold: 85 },
    { id: "p4", name: "Lifting Straps", category: "Accessories", price: 350, stock: 200, sold: 45 },
    { id: "p5", name: "Protein Bar (Box)", category: "Snacks", price: 1200, stock: 15, sold: 200 },
]

export const SHOWCASE_INVOICES = [
    { id: "inv001", member: { id: "m1", name: "Rahul Sharma" }, amount: 2500, status: "PAID", date: new Date("2024-02-10"), type: "PRODUCT" },
    { id: "inv002", member: { id: "m2", name: "Anjali Gupta" }, amount: 15000, status: "PAID", date: new Date("2024-02-08"), type: "MEMBERSHIP" },
    { id: "inv003", member: { id: "m3", name: "Vikram Singh" }, amount: 4500, status: "PENDING", date: new Date("2024-02-05"), type: "MEMBERSHIP" },
]

export const SHOWCASE_LEADS = [
    { id: 'l1', name: 'Rahul Khanna', phone: '9876543210', status: 'NEW', source: 'Instagram', createdAt: new Date() },
    { id: 'l2', name: 'Sneha Rao', phone: '9123456789', status: 'CONTACTED', source: 'Facebook', createdAt: new Date() },
    { id: 'l3', name: 'Vikram Mehta', phone: '9988776655', status: 'INTERESTED', source: 'Walk-in', createdAt: new Date() }
]

export const SHOWCASE_AT_RISK = [
    { id: 'm3', name: 'Vikram Singh', phone: '7766554433', status: 'EXPIRED', lastAttended: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
    { id: 'm6', name: 'Suresh Kumar', phone: '9000000000', status: 'ACTIVE', lastAttended: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) }
]

export const getShowcaseMember = (id: string) => SHOWCASE_MEMBERS.find(m => m.id === id) || SHOWCASE_MEMBERS[0]
