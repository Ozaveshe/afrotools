import sys

content = open('C:/Users/Oza/Documents/afrotools/assets/js/components/navbar.min.js', 'r', encoding='utf-8').read()

old_str = 'HELB Repayment Calculator",href:"/tools/helb-repayment/",emoji:"\U0001f1f0\U0001f1ea",badge:"NEW"},{label:"Exam Countdown Timer"'

new_str = (
    'HELB Repayment Calculator",href:"/tools/helb-repayment/",emoji:"\U0001f1f0\U0001f1ea",badge:"NEW"}'
    ',{label:"KCSE Grade Calculator",href:"/tools/kcse-calculator/",emoji:"\U0001f1f0\U0001f1ea",badge:"NEW"}'
    ',{label:"Ghana NSS Allowance",href:"/tools/national-service-gh/",emoji:"\U0001f1ec\U0001f1ed",badge:"NEW"}'
    ',{label:"University Admission Points",href:"/tools/university-admission/",emoji:"\U0001f393",badge:"NEW"}'
    ',{label:"Scholarship Eligibility Checker",href:"/tools/scholarship-check/",emoji:"\U0001f3c6",badge:"NEW"}'
    ',{label:"Student Budget Planner",href:"/tools/student-budget/",emoji:"\U0001f4b8",badge:"NEW"}'
    ',{label:"Coding Bootcamp Comparator",href:"/tools/coding-bootcamp/",emoji:"\U0001f4bb",badge:"NEW"}'
    ',{label:"Exam Countdown Timer"'
)

if old_str in content:
    new_content = content.replace(old_str, new_str, 1)
    with open('C:/Users/Oza/Documents/afrotools/assets/js/components/navbar.min.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Updated navbar.min.js successfully')
    print('Original length:', len(content), '-> New length:', len(new_content))
else:
    # Try to find what's there
    idx = content.find('HELB Repayment Calculator')
    print('HELB found at:', idx)
    print('Context:', repr(content[idx-20:idx+200]))
