
export const professionIconMap: Record<string, any> = {
    Tailor: 'scissors-cutting',
    Carpenter: 'hammer-screwdriver',
    Electrician: 'flash',
    Plumber: 'pipe',
    Teacher: 'school',
    Shopkeeper: 'store',
    Farmer: 'tractor',
    Driver: 'car',
    Mechanic: 'car-wrench',
    Doctor: 'doctor',
    Nurse: 'account-child-circle', // nurse is sometimes missing, using alternative
    Welder: 'flashlight', // welding icons vary
    'Construction Worker': 'hard-hat',
    Painter: 'format-paint',
    Vendor: 'storefront',
    Hairdresser: 'content-cut',
    Cobbler: 'shoe-formal',
    'Mobile Shop Owner': 'cellphone',
    'Computer Technician': 'laptop',
    'Driver Assistant': 'account-arrow-right',
    'Electrician Assistant': 'flash-outline',
    'Tailor Assistant': 'scissors-cutting',
    'Construction Foreman': 'clipboard-check',
    'Shop Assistant': 'account-tie',
    Baker: 'bread-slice',
    Cook: 'chef-hat',
    Barber: 'content-cut',
    'Security Guard': 'shield-account',
    Milkman: 'bottle-tonic',
    Fisherman: 'fish',
    'Stone Cutter': 'pickaxe',
    Mason: 'wall',
    'Driver (Taxi/Bus)': 'bus',
    'Vegetable Vendor': 'carrot',
    'Fruit Vendor': 'apple',
    'Grocery Shop Owner': 'cart',
    Handyman: 'tools',
    Laborer: 'account-hard-hat',
    Plasterer: 'trowel',
    'Welder Assistant': 'flashlight-outline',
    'Car Washer': 'car-wash',
    'Rickshaw Driver': 'rickshaw',
    'Mechanic Assistant': 'car-wrench',
    'Car Painter': 'spray',
    'Electric Bike Repairer': 'moped-electric',
    'Labor Contractor': 'account-group',
    'Auto Electrician': 'car-electric',
    Photographer: 'camera',
    'Driver Trainer': 'steering',
    'CCTV Installer': 'cctv',
    'Mobile Repairer': 'cellphone-cog',
    Others: 'dots-horizontal',
};

const PALETTE = [
    '#FF9B51', // Orange
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#A855F7', // Purple
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#06B6D4', // Cyan
    '#8B5CF6', // Violet
    '#F97316', // Orange Red
    '#14B8A6', // Teal
    '#6366F1', // Indigo
];

export const getProfessionIcon = (profession: string): string => {
    return professionIconMap[profession] || 'dots-horizontal';
};

export const getCategoryColor = (category: string): string => {
    if (!category) return PALETTE[0];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PALETTE.length;
    return PALETTE[index];
};
