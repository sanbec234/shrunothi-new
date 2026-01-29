export type Genre = { 
  id: string; 
  name: string; 
};

export type Podcast = {
  id: string;
  title: string;
  author: string;
  spotifyUrl: string;
  genreId: string;
};

export type Material = {
  id: string;
  title: string;
  author: string;
  content: string;
  genreId: string;
};

export type SelfHelp = {
  id: string;
  title: string;
  author: string;
  content: string;
};

export type AdminEmail = {
  id: string;
  email: string;
};

export type User = {
  id: string;
  name?: string;
  email: string;
  role: string;
  created_at?: string;
  last_login?: string;
};