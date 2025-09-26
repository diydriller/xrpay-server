import { Injectable } from '@nestjs/common';

@Injectable()
export class PortoneService {
  constructor() {}

  private readonly baseUrl = 'https://api.iamport.kr';

  async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/users/getToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imp_key: process.env.PORTONE_API_KEY,
        imp_secret: process.env.PORTONE_SECRET_KEY,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
    }

    const { response: data } = await response.json();
    return data.access_token;
  }

  async getPaymentData(impUid: string): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/payments/${impUid}`, {
      headers: { Authorization: token },
    });

    if (!response.ok) {
      const errorBody = await response.text();
    }

    const { response: data } = await response.json();
    return data;
  }
}
