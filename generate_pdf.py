from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=15, style="B")
pdf.cell(200, 10, txt="Q3 Cloud Infrastructure Migration - Post-Mortem", ln=1, align="C")

pdf.set_font("Arial", size=12)
pdf.ln(10)
content = (
    "Executive Summary:\n"
    "On September 15th, the infrastructure team successfully migrated 500 virtual machines "
    "from the legacy datacenter to the new AWS us-east-1 region. The overall migration "
    "took 14 hours and was largely successful, except for one critical incident.\n\n"
    "Critical Incident Report (02:00 AM - 03:15 AM):\n"
    "Shortly after switching DNS records to the new environment, monitoring alerts fired indicating "
    "a massive spike in 502 Bad Gateway errors across all customer-facing APIs. "
    "Customer traffic was completely disrupted for 1 hour and 15 minutes.\n\n"
    "Root Cause Analysis:\n"
    "The issue was traced to the primary Nginx load balancer configuration. "
    "The 'proxy_read_timeout' directive was accidentally left at its default value of 10 seconds, "
    "rather than our required production value of 60 seconds. Since many backend API requests "
    "take 15-20 seconds to process heavy database queries, the load balancer was dropping the "
    "connections prematurely and returning 502 errors to the clients.\n\n"
    "Mitigation and Resolution:\n"
    "At 03:05 AM, the DevOps on-call engineer (Sarah J.) manually SSH'd into the Nginx ingress "
    "controller. She updated the 'proxy_read_timeout' value to 60s and reloaded the Nginx service. "
    "By 03:15 AM, all API traffic had fully recovered and error rates dropped to 0%.\n\n"
    "Future Action Items:\n"
    "- Implement automated configuration linting for all Nginx files in CI/CD.\n"
    "- Reduce heavy database query times to under 5 seconds to avoid timeout reliance."
)

pdf.multi_cell(0, 10, txt=content)
pdf.output("sample_data/Q3_Migration_PostMortem.pdf")
print("PDF generated successfully!")
