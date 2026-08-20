# Scheme 2025 — nflverse PBP

Pulled 2026-08-19. Source: nflverse `play_by_play_2025.parquet` regular season (not 2024). Receiver position from `roster_2025.csv` via gsis_id.

Clubs: 32 (WSH not WAS, LAR not LA).
League offensive snaps (pass+run): 32941.
League shotgun: 65.9% (snap-weighted). Under-center bucket is 1 − shotgun; this PBP file has no pistol column.
League checkdown (RB/HB/FB target with air_yards ≤ 1, among targeted dropbacks): 11.5%.
League RB target rate (RB targets / dropbacks): 15.9%.

## Shotgun — top 5
- WSH: 87.8% (979 snaps)
- CIN: 82.0% (1049 snaps)
- KC: 80.7% (1048 snaps)
- ATL: 80.5% (1036 snaps)
- NO: 78.8% (1064 snaps)

## Shotgun — bottom 5
- CHI: 51.8% (1096 snaps)
- DET: 51.5% (1051 snaps)
- BUF: 49.8% (1065 snaps)
- SEA: 46.2% (997 snaps)
- LAR: 41.0% (1056 snaps)

## Checkdown — top 5 (most dump-off)
- PIT: 18.3% (96/524 targeted)
- MIA: 16.3% (76/465 targeted)
- CLE: 15.8% (83/524 targeted)
- LV: 14.1% (70/496 targeted)
- CAR: 14.1% (68/482 targeted)

## Checkdown — bottom 5 (fewest dump-off)
- DAL: 8.4% (51/610 targeted)
- SEA: 8.3% (38/457 targeted)
- WSH: 8.0% (35/436 targeted)
- HOU: 7.5% (42/557 targeted)
- LAR: 3.1% (18/581 targeted)

## Backup QB gaps that qualified (backup_dropbacks ≥ 40)

backup_gap_pts = clamp((backup_epa − starter_epa) × 8, −4.5, 0). The 8 is a crude EPA/dropback → spread-point translation. Null if sample < 40 — no invented 3.5.

- KC: starter P.Mahomes, backup dropbacks 95, gap EPA -0.583, gap pts -4.50
- LAC: starter J.Herbert, backup dropbacks 63, gap EPA -0.634, gap pts -4.50
- LV: starter G.Smith, backup dropbacks 76, gap EPA -0.311, gap pts -2.49
- IND: starter D.Jones, backup dropbacks 171, gap EPA -0.283, gap pts -2.27
- CIN: starter J.Burrow, backup dropbacks 402, gap EPA -0.213, gap pts -1.70
- BAL: starter L.Jackson, backup dropbacks 129, gap EPA -0.200, gap pts -1.60
- HOU: starter C.Stroud, backup dropbacks 169, gap EPA -0.185, gap pts -1.48
- NYJ: starter J.Fields, backup dropbacks 324, gap EPA -0.146, gap pts -1.17
- MIA: starter T.Tagovailoa, backup dropbacks 103, gap EPA -0.144, gap pts -1.15
- NO: starter T.Shough, backup dropbacks 282, gap EPA -0.116, gap pts -0.93
- PHI: starter J.Hurts, backup dropbacks 46, gap EPA -0.105, gap pts -0.84
- GB: starter J.Love, backup dropbacks 58, gap EPA -0.098, gap pts -0.79
- CAR: starter B.Young, backup dropbacks 45, gap EPA -0.082, gap pts -0.66
- ATL: starter M.Penix, backup dropbacks 284, gap EPA -0.015, gap pts -0.12
- ARI: starter J.Brissett, backup dropbacks 180, gap EPA +0.056, gap pts 0.00
- CLE: starter S.Sanders, backup dropbacks 376, gap EPA +0.020, gap pts 0.00
- MIN: starter J.McCarthy, backup dropbacks 275, gap EPA +0.020, gap pts 0.00
- NYG: starter J.Dart, backup dropbacks 201, gap EPA +0.038, gap pts 0.00
- PIT: starter A.Rodgers, backup dropbacks 54, gap EPA +0.019, gap pts 0.00
- SF: starter M.Jones, backup dropbacks 299, gap EPA +0.067, gap pts 0.00
- WSH: starter M.Mariota, backup dropbacks 264, gap EPA +0.010, gap pts 0.00

## Did not qualify for a backup-gap number (sample < 40)

- BUF: 37 backup dropbacks (starter J.Allen) → backup_gap_pts = null
- TEN: 31 backup dropbacks (starter C.Ward) → backup_gap_pts = null
- DAL: 24 backup dropbacks (starter D.Prescott) → backup_gap_pts = null
- TB: 17 backup dropbacks (starter B.Mayfield) → backup_gap_pts = null
- NE: 11 backup dropbacks (starter D.Maye) → backup_gap_pts = null
- CHI: 6 backup dropbacks (starter C.Williams) → backup_gap_pts = null
- DET: 5 backup dropbacks (starter J.Goff) → backup_gap_pts = null
- SEA: 4 backup dropbacks (starter S.Darnold) → backup_gap_pts = null
- JAX: 3 backup dropbacks (starter T.Lawrence) → backup_gap_pts = null
- DEN: 2 backup dropbacks (starter B.Nix) → backup_gap_pts = null
- LAR: 1 backup dropbacks (starter M.Stafford) → backup_gap_pts = null
