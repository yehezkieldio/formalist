# Known Limitations

- Scanned-only PDFs without extractable text need future OCR support.
- Local artifact persistence depends on `UPLOAD_ROOT`; ephemeral disks may lose
  optional original files, page images, and debug artifacts.
- No object storage integration is required in the first version.
- No seed tariff data is included.
- No eval/test-question dashboard is implemented.
- No third-party auth provider dependency is included.
- Upstash Redis REST may not support every BullMQ-style worker behavior; use
  the DB fallback queue when needed.
- Verified numeric answers require reviewed active data. If no reviewed active
  facts or rows exist, the assistant should refuse trusted numeric answers.
