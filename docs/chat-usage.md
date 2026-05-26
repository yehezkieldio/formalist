# Chat Usage

Use `/chat` for natural-language questions.

## General RAG Mode

Used for summaries, definitions, explanations, and source lookup. The assistant
may answer from retrieved chunks with citations.

Examples:

- `Ringkas isi dokumen ini`
- `Apa aturan PPN di dokumen?`
- `Tampilkan sumber harga ini dari file mana dan halaman berapa`

## Verified Numeric Mode

Used for prices, fees, totals, validity dates, schedules, route availability,
promo/regular comparison, destination availability, and quotes.

The assistant must call tools and use reviewed active facts, tariff rows, and
fee rules. Raw chunks alone are unverified context and are not trusted numeric
truth.

Examples:

- `Harga Pelita ke Surabaya berapa?`
- `Tujuan UPG paling murah maskapai apa?`
- `Bandingkan harga promo dan regular untuk Yogyakarta`

## Quote Mode

For totals, the assistant calls deterministic TypeScript quote calculation. The
LLM can explain the result but is not the source of the math.

Example:

- `Kalau 20 kg ke Surabaya pakai Pelita total berapa?`

## Confidence States

- `CONFIDENT`: reviewed active source data supports the answer.
- `NEEDS_CONFIRMATION`: data exists but warnings or ambiguity remain.
- `UNVERIFIED`: only unreviewed/raw evidence is available.
- `UNANSWERABLE`: no sufficient trusted evidence was found.
