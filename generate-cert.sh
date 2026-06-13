#!/bin/bash
set -e

CERT_DIR="./ssl"
mkdir -p "$CERT_DIR"

echo "生成自签名证书..."
openssl req -x509 -nodes -days 3650 \
  -newkey rsa:2048 \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -subj "/CN=43.139.245.150" \
  -addext "subjectAltName=IP:43.139.245.150"

echo "✓ 证书已生成到 $CERT_DIR/"
echo "  cert.pem — 证书"
echo "  key.pem  — 私钥"
