import { Client } from "../../clients/entities/client.entity";

export type ClientAuthResponse = {
    token: string;
    client: Client;
};
