# Load Testing Enhancement - Enterprise Edition

## Overview

Enhanced the Load Testing page with enterprise-grade features including advanced configuration options, predefined test profiles, and comprehensive parameter support.

## Changes Made

### 1. Backend API (`src/app/api/v1/load-test/route.ts`)

**Enhanced to support advanced k6 parameters:**

- ✅ Ramping stages for gradual load increase/decrease
- ✅ Custom HTTP headers
- ✅ Request timeout configuration
- ✅ Max redirects
- ✅ Think time between requests
- ✅ RPS (requests per second) limiting
- ✅ Total iterations
- ✅ Connection reuse options
- ✅ Graceful stop timing
- ✅ Setup/teardown timeouts
- ✅ Custom tags

### 2. Frontend Components

#### New Files Created:

1. **`types/load-test.types.ts`** - TypeScript type definitions
2. **`utils/test-profiles.ts`** - Predefined test scenarios:

   - Smoke Test (1 VU, 30s)
   - Load Test (50 VUs, 5min with ramping)
   - Stress Test (200 VUs, 10min with ramping)
   - Spike Test (500 VUs, 3min sudden spike)
   - Soak Test (100 VUs, 1 hour)
   - Breakpoint Test (1000 VUs, 20min incremental)

3. **`components/test-profile-selector.component.tsx`** - Visual profile selector
4. **`components/advanced-config.component.tsx`** - Advanced configuration panel with:
   - Ramping stages editor
   - Performance options (timeout, think time, RPS, iterations)
   - Custom HTTP headers manager
   - Connection options

#### Updated Files:

1. **`page.tsx`** - Main load testing page:
   - Added tabbed interface (Profiles, Basic, Advanced)
   - Integrated profile selector
   - Enhanced state management
   - Added success/error messages

### 3. Localization

**Added translations in both `en.json` and `th.json`:**

- Tab labels
- Profile descriptions
- Advanced configuration labels and tooltips
- Success/error messages

## Features

### Test Profiles

Users can quickly select from 6 predefined test scenarios:

- **Smoke Test**: Minimal load verification
- **Load Test**: Average expected load with ramping
- **Stress Test**: Beyond normal capacity
- **Spike Test**: Sudden extreme load
- **Soak Test**: Extended duration testing
- **Breakpoint Test**: Incremental load until failure

### Advanced Configuration

- **Ramping Stages**: Define custom load patterns
- **Performance Tuning**:
  - Request timeout
  - Think time (pause between requests)
  - RPS limiting
  - Total iterations
  - Max redirects
- **Custom Headers**: Add authentication or custom headers
- **Connection Options**: Control connection reuse behavior

### UI/UX Improvements

- Tabbed interface for better organization
- Visual profile cards with icons and colors
- Collapsible advanced options
- Badge indicators for active configurations
- Success/error notifications

## Usage

### Basic Usage:

1. Navigate to Load Testing page
2. Select "Test Profiles" tab
3. Click on a predefined profile
4. Switch to "Basic Config" tab
5. Adjust URL and script if needed
6. Click "Run Load Test"

### Advanced Usage:

1. Select a profile or configure manually
2. Switch to "Advanced Options" tab
3. Configure:
   - Add ramping stages
   - Set performance parameters
   - Add custom headers
   - Adjust connection options
4. Return to "Basic Config" tab
5. Click "Run Load Test"

## Technical Details

### API Request Format:

```json
{
  "script": "example-load-test",
  "baseURL": "https://api.example.com",
  "request": 50,
  "second": 300,
  "stages": [
    { "duration": 60, "target": 50 },
    { "duration": 180, "target": 50 },
    { "duration": 60, "target": 0 }
  ],
  "headers": {
    "Authorization": "Bearer token",
    "X-Custom-Header": "value"
  },
  "timeout": 60,
  "thinkTime": 1,
  "rps": 100,
  "maxRedirects": 10
}
```

### k6 Command Generated:

```bash
k6 run \
  --env=BASE_URL=https://api.example.com \
  --stage=60s:50 \
  --stage=180s:50 \
  --stage=60s:0 \
  --env=TIMEOUT=60s \
  --env=THINK_TIME=1 \
  --rps=100 \
  --env=MAX_REDIRECTS=10 \
  --env=CUSTOM_HEADERS='{"Authorization":"Bearer token"}' \
  /path/to/script.js
```

## Benefits

1. **Ease of Use**: Predefined profiles for common scenarios
2. **Flexibility**: Advanced options for custom requirements
3. **Enterprise-Ready**: Professional UI and comprehensive options
4. **Bilingual**: Full Thai and English support
5. **Type-Safe**: Complete TypeScript coverage
6. **Maintainable**: Well-structured component architecture

## Future Enhancements (Optional)

- [ ] Save custom test configurations
- [ ] Historical test results comparison
- [ ] Threshold configuration UI
- [ ] Export test configurations
- [ ] Test scheduling
- [ ] Real-time metrics dashboard
- [ ] Multiple concurrent tests
- [ ] Test result analytics

---

**Status**: ✅ Completed
**Date**: 2025-11-27
**Version**: Enterprise Edition v1.0
