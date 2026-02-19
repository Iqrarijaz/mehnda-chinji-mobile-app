import { GET_AUTH_HEADER } from "@/utils/token";
import axios from "axios";
import { baseUrl } from "../../configs";

const api = axios.create({
    baseURL: `${baseUrl}/api/user/v1`
});

async function request<T>(config: any): Promise<T> {
    try {
        const headers = await GET_AUTH_HEADER();
        const response = await api({
            ...config,
            headers: {
                ...headers,
                ...(config.headers || {})
            }
        });
        return response.data;
    } catch (error: any) {
        console.error("API Error:", error);
        throw error?.response?.data?.message || "Something went wrong";
    }
}

export const PLACES_QUERY_KEYS = {
    all: ["places"] as const,
    list: (filters: Record<string, any>) =>
        [...PLACES_QUERY_KEYS.all, "infinite-list", filters] as const
};

export const PLACE_SUBMISSION_QUERY_KEYS = {
    myRequests: (params: { page: number; category?: string }) =>
        ["my-place-requests", params] as const
};

export function GET_PLACES_LIST(params: {
    search?: string;
    category?: string;
    limit?: number;
    skip?: number;
    lat?: number;
    lng?: number;
}) {
    return request({
        method: "GET",
        url: "/get-places",
        params
    });
}

export function SUBMIT_PLACE(data: any) {
    return request({
        method: "POST",
        url: "/submit-place",
        data
    });
}

export function GET_MY_REQUESTS(params: {
    page?: number;
    limit?: number;
    category?: string;
}) {
    return request({
        method: "GET",
        url: "/get-my-requests",
        params
    });
}

export function UPDATE_REQUEST(id: string, data: any) {
    return request({
        method: "PUT",
        url: `/update-request/${id}`,
        data
    });
}

export function DELETE_REQUEST(id: string) {
    return request({
        method: "DELETE",
        url: `/delete-request/${id}`
    });
}
