#!/usr/bin/env python3

"""
GROUNDWORK STATUS DASHBOARD GENERATOR
Renders comprehensive project status as PNG image
Real evidence from git, tests, TIMELINE.md, etc.

Usage: python scripts/generate_status_dashboard.py
Output: ~/Desktop/Groundwork_Full_Status.png
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle
import datetime

# Color scheme
COLOR_VERIFIED = '#90EE90'    # Green
COLOR_UNVERIFIED = '#FFD700'  # Gold/Yellow
COLOR_BROKEN = '#FF6B6B'      # Red
COLOR_PENDING = '#87CEEB'     # Sky blue
COLOR_DEFERRED = '#D3D3D3'    # Light gray
COLOR_TEXT_DARK = '#1a1a1a'
COLOR_TEXT_LIGHT = '#666666'

def create_status_box(ax, x, y, width, height, label, status_color, text_content=''):
    """Create a single status box."""
    box = FancyBboxPatch(
        (x, y), width, height,
        boxstyle="round,pad=0.05",
        linewidth=2,
        edgecolor='#333333',
        facecolor=status_color,
        alpha=0.8
    )
    ax.add_patch(box)

    ax.text(x + width/2, y + height/2 + 0.02,
            label,
            ha='center', va='center',
            fontsize=9, fontweight='bold',
            color=COLOR_TEXT_DARK)

    if text_content:
        ax.text(x + width/2, y + 0.01,
                text_content,
                ha='center', va='bottom',
                fontsize=7, style='italic',
                color=COLOR_TEXT_LIGHT)

def create_dashboard():
    """Generate the full status dashboard."""
    fig, ax = plt.subplots(figsize=(16, 20), dpi=100)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 28)
    ax.axis('off')

    y_pos = 26

    # ===== TITLE =====
    ax.text(5, y_pos, 'GROUNDWORK — PROJECT STATUS DASHBOARD',
            ha='center', va='top', fontsize=18, fontweight='bold', color=COLOR_TEXT_DARK)
    ax.text(5, y_pos - 0.4, f'Generated: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M UTC")}',
            ha='center', va='top', fontsize=9, color=COLOR_TEXT_LIGHT, style='italic')

    y_pos -= 1.2

    # ===== SECTION A: PHASE 0 GATES =====
    ax.text(0.3, y_pos, 'SECTION A: PHASE 0 GATES (4/4 gate definition, 3/4 CLEAR)',
            ha='left', va='top', fontsize=11, fontweight='bold', color=COLOR_TEXT_DARK)

    y_pos -= 0.6
    gate_y = y_pos

    # Gate 1: API Key
    create_status_box(ax, 0.3, gate_y - 0.8, 2.2, 0.7,
                     '✅ Gate 1: API Key', COLOR_VERIFIED, 'Estimate E2E verified')

    # Gate 2: GitHub
    create_status_box(ax, 2.7, gate_y - 0.8, 2.2, 0.7,
                     '✅ Gate 2: GitHub', COLOR_VERIFIED, 'Private repo, Ryan invited')

    # Gate 3: Questions
    create_status_box(ax, 5.1, gate_y - 0.8, 2.2, 0.7,
                     '✅ Gate 3: Questions v2.2', COLOR_VERIFIED, 'Config-wired, randomized')

    # Gate 4: Walkthrough
    create_status_box(ax, 7.5, gate_y - 0.8, 2.2, 0.7,
                     '❌ Gate 4: Walkthrough', COLOR_BROKEN, 'INCOMPLETE (no founder E2E)')

    y_pos -= 1.8

    # ===== SECTION B: JOURNEY STATUS =====
    ax.text(0.3, y_pos, 'SECTION B: JOURNEY (9/9 BUILT, UNVERIFIED)',
            ha='left', va='top', fontsize=11, fontweight='bold', color=COLOR_TEXT_DARK)

    y_pos -= 0.6
    journey_data = [
        ('J0: Auth', COLOR_VERIFIED, 'Live'),
        ('J1: Onboarding', COLOR_VERIFIED, 'Live'),
        ('J1b: Properties', COLOR_VERIFIED, 'Live'),
        ('J2a: Budget', COLOR_VERIFIED, 'Live'),
        ('J2: Personality', COLOR_VERIFIED, 'Live'),
        ('J3: Swipe (80% gate UNTESTED)', COLOR_BROKEN, 'Unverified'),
        ('J8: Saved List', COLOR_UNVERIFIED, 'Unverified'),
        ('J4: Messaging', COLOR_UNVERIFIED, 'Unverified'),
        ('J9: Communities', COLOR_UNVERIFIED, 'Unverified'),
        ('J7: Checklist (spec mismatch)', COLOR_BROKEN, 'Unverified'),
        ('J6: Demo Seed (auth fixed)', COLOR_UNVERIFIED, 'Unverified'),
    ]

    x_start = 0.3
    col_width = 0.85
    row_height = 0.55

    for idx, (label, color, status) in enumerate(journey_data):
        row = idx // 12
        col = idx % 12
        x = x_start + (col * col_width)
        y = y_pos - (row * row_height)

        if col >= 12:
            row += 1
            col = 0
            x = x_start
            y = y_pos - (row * row_height)

        create_status_box(ax, x, y - 0.4, col_width - 0.1, 0.35,
                         label.split(':')[0], color, label.split(':')[1] if ':' in label else status)

    y_pos -= 2.5

    # ===== SECTION C: MECHANICS =====
    ax.text(0.3, y_pos, 'SECTION C: CORE MECHANICS (Wave Assignment)',
            ha='left', va='top', fontsize=11, fontweight='bold', color=COLOR_TEXT_DARK)

    y_pos -= 0.6
    mechanics = [
        ('Match Scoring', '🔴 W1 (now)', COLOR_VERIFIED),
        ('Passport (Scoring)', '🔴 W1 (now)', COLOR_VERIFIED),
        ('Backstory (AI profile)', '🟡 W2', COLOR_DEFERRED),
        ('Score Explanation', '🟡 W2', COLOR_DEFERRED),
        ('Oracle (AI cost cap)', '🔴 W1 (building)', COLOR_UNVERIFIED),
    ]

    for idx, (name, wave, color) in enumerate(mechanics):
        x = 0.3 + (idx * 1.9)
        create_status_box(ax, x, y_pos - 0.5, 1.8, 0.4, name, color, wave)

    y_pos -= 1.3

    # ===== SECTION D: 15 KILLS GRID =====
    ax.text(0.3, y_pos, 'SECTION D: 15 KILLS (Security, Compliance, Observability)',
            ha='left', va='top', fontsize=11, fontweight='bold', color=COLOR_TEXT_DARK)

    y_pos -= 0.6
    kills = [
        (1, 'Founder Walkthrough', COLOR_BROKEN),
        (2, 'Constitution', COLOR_UNVERIFIED),
        (3, 'Match Confidence', COLOR_DEFERRED),
        (4, 'Contractor Suspend', COLOR_DEFERRED),
        (5, 'Paid Events', COLOR_VERIFIED),
        (6, 'Contractor Supply', COLOR_DEFERRED),
        (7, 'Runbook', COLOR_VERIFIED),
        (8, 'Credential Rotation', COLOR_DEFERRED),
        (9, 'Constitution Audit', COLOR_VERIFIED),
        (10, 'Runway Numbers', COLOR_BROKEN),
        (11, 'Design System', COLOR_DEFERRED),
        (12, 'AI Cost Cap', COLOR_UNVERIFIED),
        (13, 'Legal TODO List', COLOR_VERIFIED),
        (14, 'Demo Isolation', COLOR_VERIFIED),
        (15, 'Observability', COLOR_DEFERRED),
    ]

    for idx, (num, name, color) in enumerate(kills):
        row = idx // 5
        col = idx % 5
        x = 0.3 + (col * 1.9)
        y = y_pos - (row * 0.55)

        create_status_box(ax, x, y - 0.4, 1.8, 0.35,
                         f'KILL {num}', color, name[:20])

    y_pos -= 2.2

    # ===== SECTION E: BUSINESS/LEGAL BAR =====
    ax.text(0.3, y_pos, 'SECTION E: BUSINESS & LEGAL READINESS',
            ha='left', va='top', fontsize=11, fontweight='bold', color=COLOR_TEXT_DARK)

    y_pos -= 0.6
    business = [
        ('Attorney Review', COLOR_BROKEN, '0/10 items'),
        ('C-Corp Setup', COLOR_BROKEN, 'Not started'),
        ('ToS + Privacy', COLOR_BROKEN, 'Not drafted'),
        ('Runway Known', COLOR_BROKEN, 'FOUNDER TASK'),
        ('Waitlist Deployed', COLOR_DEFERRED, 'Post-design'),
        ('Scorecard', COLOR_DEFERRED, 'TBD'),
    ]

    for idx, (label, color, detail) in enumerate(business):
        x = 0.3 + (idx * 1.55)
        create_status_box(ax, x, y_pos - 0.5, 1.4, 0.4, label, color, detail)

    y_pos -= 1.3

    # ===== SECTION F: VERDICT =====
    ax.text(5, y_pos, '⚠️  VERDICT  ⚠️',
            ha='center', va='top', fontsize=14, fontweight='bold', color=COLOR_BROKEN)

    y_pos -= 0.5

    verdict_text = (
        'Infrastructure: WON ✅ (build, tests, DB, GitHub)\n'
        'Product: BUILT, UNVERIFIED (J3-J6 have 0 functional tests)\n'
        'Legal/Business: NOT STARTED ❌ (ToS, Privacy, C-Corp pending)\n'
        'Gate 4 Walkthrough: INCOMPLETE (founder never completed estimate→questions→match→message)\n\n'
        'NEXT STEPS: Part 2 real verification → Part 3 J7 decision → Part 4 armor repair\n'
        'NO design pass. NO new features. STOP. Await founder review.'
    )

    ax.text(5, y_pos - 0.2, verdict_text,
            ha='center', va='top', fontsize=9, color=COLOR_TEXT_DARK,
            bbox=dict(boxstyle='round', facecolor=COLOR_UNVERIFIED, alpha=0.3),
            family='monospace', linespacing=1.8)

    y_pos -= 2.5

    # ===== FOOTER =====
    ax.text(5, y_pos, 'Generated by scripts/generate_status_dashboard.py | Evidence: TIMELINE.md, PROGRESS_MAP.md, git log, test results',
            ha='center', va='top', fontsize=8, color=COLOR_TEXT_LIGHT, style='italic')

    # ===== LEGEND =====
    legend_y = 0.5
    ax.text(0.3, legend_y, 'LEGEND:', fontsize=9, fontweight='bold', color=COLOR_TEXT_DARK)

    legend_items = [
        (COLOR_VERIFIED, '🟢 Verified (real evidence)'),
        (COLOR_UNVERIFIED, '🟡 Unverified (code exists, no E2E)'),
        (COLOR_BROKEN, '🔴 Broken/Incomplete (spec mismatch, gap)'),
        (COLOR_DEFERRED, '⚪ Correctly deferred (Wave 2+)'),
    ]

    for idx, (color, label) in enumerate(legend_items):
        x = 0.3 + (idx * 2.3)
        rect = Rectangle((x, legend_y - 0.3), 0.2, 0.2, facecolor=color, edgecolor='#333', linewidth=1)
        ax.add_patch(rect)
        ax.text(x + 0.35, legend_y - 0.2, label, ha='left', va='center', fontsize=8, color=COLOR_TEXT_DARK)

    plt.tight_layout()
    return fig

def main():
    """Generate and save dashboard."""
    import os

    fig = create_dashboard()

    output_path = os.path.expanduser('~/Desktop/Groundwork_Full_Status.png')
    fig.savefig(output_path, dpi=100, bbox_inches='tight', facecolor='white')

    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)

    print(f'✅ Dashboard saved: {output_path}')
    print(f'   File size: {file_size_mb:.2f} MB')
    print(f'   Resolution: 1600x2000px (100 dpi)')

    # Show file info
    os.system(f'ls -lh {output_path}')
    print(f'\n📊 Open with: open {output_path}')

if __name__ == '__main__':
    main()
