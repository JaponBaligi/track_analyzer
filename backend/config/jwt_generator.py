#!/usr/bin/env python3
"""
Utility script to generate JWT secret key.
Run this script to generate a secure random key for JWT_SECRET environment variable.
"""
import secrets

if __name__ == "__main__":
    secret_key = secrets.token_hex(32)
    print(secret_key)
