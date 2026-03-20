#!/bin/bash
# ============================================
# Shopee AFF — Semi-Auto Product Addition
# ============================================
# Usage: ./scripts/add-product.sh
#
# Flow:
#   1. คุณส่ง Shopee URL + ราคา
#   2. Script สร้าง review markdown
#   3. Build + Deploy
#   4. สร้าง tweet draft
#
# ต้องรัน Claude Code เพื่อเขียน content
# Script นี้เป็น helper template
# ============================================

echo "🛒 Shopee AFF — เพิ่มสินค้าใหม่"
echo "================================"
echo ""
echo "ส่งข้อมูลให้ Claude Code:"
echo ""
echo '  เพิ่มสินค้าใหม่:'
echo '  - Shopee URL: [วาง link ที่นี่]'
echo '  - ชื่อสินค้า: [ชื่อ]'
echo '  - ราคา: [฿xxx]'
echo '  - หมวด: tech / home / beauty / health'
echo ""
echo "Claude จะทำให้:"
echo "  1. เขียนรีวิว 800+ คำ + FAQ + Pros/Cons"
echo "  2. สร้าง Schema.org markup"
echo "  3. Build เว็บ"
echo "  4. สร้าง tweet draft"
echo ""
echo "================================"
