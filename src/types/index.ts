// Common types used throughout the application

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PageProps {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
}