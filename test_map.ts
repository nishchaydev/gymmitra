const today = new Date();
today.setHours(0, 0, 0, 0);

const birthdays = [
    { name: 'Nishchay Gupta', phone: '0123654789', dateOfBirth: new Date('2026-04-05T00:00:00.000Z') }
];

const upcomingBirthdays = birthdays
    .filter((m: any) => {
        if (!m.dateOfBirth) return false;
        const dob = new Date(m.dateOfBirth);
        return !isNaN(dob.getTime());
    })
    .map((m: any) => {
        const dobString = typeof m.dateOfBirth === 'string' ? m.dateOfBirth : m.dateOfBirth.toISOString();
        const [year, month, day] = dobString.split('T')[0].split('-').map(Number);
        const dob = new Date(year, month - 1, day);
        const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
        if (next < today) next.setFullYear(today.getFullYear() + 1)
        const diffDays = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const label = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${dob.getDate()} ${monthNames[dob.getMonth()]}`
        return { ...m, date: label, diffDays }
    })
    .sort((a: any, b: any) => a.diffDays - b.diffDays)
    .slice(0, 5)

console.log("UPCOMING:", upcomingBirthdays);
