import { useState } from "react";
import { toast } from 'sonner';

const useFetch = (callback: any) => {
    const [data, setData] = useState(undefined);
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<unknown>(null);

    const fn= async(...args: any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await callback(...args);
            setData(response);
        } catch (error) {
            setError(error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return {data, loading, error, fn};
}

export default useFetch;