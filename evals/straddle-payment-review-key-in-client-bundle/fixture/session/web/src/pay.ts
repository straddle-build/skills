const straddleKey = import.meta.env.VITE_STRADDLE_API_KEY;

export async function payForWalk(orderId: string, paykey: string, amountCents: number) {
  const res = await fetch("https://sandbox.straddle.com/v1/charges", {
    method: "POST",
    headers: { Authorization: `Bearer ${straddleKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ paykey, amount: amountCents, currency: "USD", external_id: `order-${orderId}` }),
  });
  return res.json();
}
