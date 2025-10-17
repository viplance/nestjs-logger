export type Context = {
  rawHeaders: { [key: string]: string };
  url: string;
  method: string;
  params: any;
  body: any;
};
