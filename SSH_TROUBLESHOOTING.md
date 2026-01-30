# SSH Connection Troubleshooting

## Check Server Status

1. **AWS Console**:
   - Go to EC2 → Instances
   - Check if instance is "running"
   - Check Status Checks (should be 2/2 checks passed)
   - Verify Security Group allows SSH (port 22) from your IP

2. **Check Your IP**:
   - Your IP might have changed
   - Update Security Group to allow SSH from your current IP
   - Or temporarily allow 0.0.0.0/0 for testing (not recommended for production)

## Quick Fix: Update Security Group

1. Go to AWS Console → EC2 → Instances
2. Select your instance
3. Click Security tab → Security Groups → Click on the Security Group
4. Edit Inbound Rules
5. Add/Update SSH rule:
   - Type: SSH
   - Port: 22
   - Source: My IP (or 0.0.0.0/0 temporarily)
   - Save rules

## Alternative: AWS Systems Manager Session Manager

If you have SSM agent running (usually pre-installed on Amazon Linux 2):

1. Go to EC2 → Instances → Select instance
2. Click "Connect" button
3. Choose "Session Manager" tab
4. Click "Connect"
5. This opens a browser-based terminal (no SSH key needed)

## Test Connection

Once Security Group is updated, try:
```bash
ssh -i Emmy.pem ubuntu@98.92.181.124
```

If it still doesn't work, check:
- Is the instance running?
- Is your local IP blocked by a firewall?
- Is the SSH key file permission correct? (`chmod 600 Emmy.pem`)

