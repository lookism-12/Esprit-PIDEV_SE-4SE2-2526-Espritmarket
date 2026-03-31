export interface MenuItem {
    label: string;
    icon: string;
    route: string;
    badge?: number;
    children?: MenuItem[];
}
