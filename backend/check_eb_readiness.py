"""
Elastic Beanstalk Production Readiness Checker
Run this script to verify your project is ready for deployment
"""

import os
import sys
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def check_exists(path, description):
    """Check if a file or directory exists"""
    exists = Path(path).exists()
    status = f"{Colors.GREEN}✅{Colors.RESET}" if exists else f"{Colors.RED}❌{Colors.RESET}"
    print(f"{status} {description}: {path}")
    return exists

def check_file_contains(path, text, description):
    """Check if a file contains specific text"""
    try:
        if not Path(path).exists():
            print(f"{Colors.RED}❌{Colors.RESET} {description}: File not found")
            return False
        
        with open(path, 'r') as f:
            content = f.read()
            contains = text in content
            status = f"{Colors.GREEN}✅{Colors.RESET}" if contains else f"{Colors.RED}❌{Colors.RESET}"
            print(f"{status} {description}")
            return contains
    except Exception as e:
        print(f"{Colors.RED}❌{Colors.RESET} {description}: Error reading file")
        return False

def check_env_variable(var_name, required=True):
    """Check if environment variable is set"""
    value = os.getenv(var_name)
    exists = value is not None and value != ''
    
    if required:
        status = f"{Colors.GREEN}✅{Colors.RESET}" if exists else f"{Colors.RED}❌{Colors.RESET}"
    else:
        status = f"{Colors.GREEN}✅{Colors.RESET}" if exists else f"{Colors.YELLOW}⚠️{Colors.RESET}"
    
    print(f"{status} {var_name}: {'Set' if exists else 'Not set'}")
    return exists

def main():
    print("\n" + "="*70)
    print(f"{Colors.BLUE}🔍 ELASTIC BEANSTALK PRODUCTION READINESS CHECK{Colors.RESET}")
    print("="*70 + "\n")
    
    total_checks = 0
    passed_checks = 0
    
    # ==================== REQUIRED FILES ====================
    print(f"\n{Colors.BLUE}📁 REQUIRED FILES{Colors.RESET}")
    print("-" * 70)
    
    required_files = [
        ("requirements.txt", "Python dependencies"),
        ("application.py", "EB entry point"),
        ("config.py", "Configuration file"),
        (".ebextensions/01_flask.config", "EB configuration"),
        ("Procfile", "Process configuration"),
        (".env.example", "Environment template"),
    ]
    
    for file_path, description in required_files:
        total_checks += 1
        if check_exists(file_path, description):
            passed_checks += 1
    
    # ==================== MIDDLEWARE & SECURITY ====================
    print(f"\n{Colors.BLUE}🔒 SECURITY & MIDDLEWARE{Colors.RESET}")
    print("-" * 70)
    
    security_files = [
        ("middleware/auth.py", "Authentication middleware"),
        ("middleware/__init__.py", "Middleware package init"),
        ("validators/schemas.py", "Request validation schemas"),
        ("validators/__init__.py", "Validators package init"),
    ]
    
    for file_path, description in security_files:
        total_checks += 1
        if check_exists(file_path, description):
            passed_checks += 1
    
    # ==================== APP CONFIGURATION ====================
    print(f"\n{Colors.BLUE}⚙️ APPLICATION CONFIGURATION{Colors.RESET}")
    print("-" * 70)
    
    config_checks = [
        ("config.py", "ProductionConfig", "Production config class exists"),
        ("config.py", "DevelopmentConfig", "Development config class exists"),
        ("config.py", "CORS_ORIGINS", "CORS configuration present"),
        ("app.py", "create_app", "Application factory pattern"),
        ("app.py", "CORS", "CORS configured"),
        ("application.py", "application", "EB application variable"),
    ]
    
    for file_path, text, description in config_checks:
        total_checks += 1
        if check_file_contains(file_path, text, description):
            passed_checks += 1
    
    # ==================== AUTHENTICATION ====================
    print(f"\n{Colors.BLUE}🔐 AUTHENTICATION{Colors.RESET}")
    print("-" * 70)
    
    auth_checks = [
        ("middleware/auth.py", "require_admin", "Admin authentication decorator"),
        ("middleware/auth.py", "require_auth", "User authentication decorator"),
        ("middleware/auth.py", "verify_token", "Token verification"),
    ]
    
    for file_path, text, description in auth_checks:
        total_checks += 1
        if check_file_contains(file_path, text, description):
            passed_checks += 1
    
    # ==================== ROUTES PROTECTION ====================
    print(f"\n{Colors.BLUE}🛡️ ADMIN ROUTES PROTECTION{Colors.RESET}")
    print("-" * 70)
    
    protected_routes = [
        ("admin_api/routes/admin_announcements.py", "@require_admin", "Announcements protected"),
        ("admin_api/routes/admin_uploads.py", "# Check if this needs @require_admin", "Uploads route (manual check)"),
    ]
    
    for file_path, text, description in protected_routes:
        total_checks += 1
        if Path(file_path).exists():
            with open(file_path, 'r') as f:
                content = f.read()
                if "@require_admin" in content:
                    print(f"{Colors.GREEN}✅{Colors.RESET} {description}")
                    passed_checks += 1
                else:
                    print(f"{Colors.YELLOW}⚠️{Colors.RESET} {description}: Missing @require_admin decorator")
        else:
            print(f"{Colors.YELLOW}⚠️{Colors.RESET} {description}: File not found")
    
    # ==================== REQUIREMENTS ====================
    print(f"\n{Colors.BLUE}📦 PYTHON DEPENDENCIES{Colors.RESET}")
    print("-" * 70)
    
    required_packages = [
        "Flask",
        "Flask-CORS",
        "pymongo",
        "PyJWT",
        "marshmallow",
        "Flask-Limiter",
        "boto3",
        "gunicorn",
        "python-dotenv",
    ]
    
    if Path("requirements.txt").exists():
        with open("requirements.txt", 'r') as f:
            requirements_content = f.read()
            
        for package in required_packages:
            total_checks += 1
            if package.lower() in requirements_content.lower():
                print(f"{Colors.GREEN}✅{Colors.RESET} {package}")
                passed_checks += 1
            else:
                print(f"{Colors.RED}❌{Colors.RESET} {package}: Missing")
    else:
        print(f"{Colors.RED}❌{Colors.RESET} requirements.txt not found")
        total_checks += len(required_packages)
    
    # ==================== ENVIRONMENT VARIABLES ====================
    print(f"\n{Colors.BLUE}🌍 ENVIRONMENT VARIABLES (Load .env for local check){Colors.RESET}")
    print("-" * 70)
    
    # Try to load .env
    try:
        from dotenv import load_dotenv
        env_path = Path(".env")
        if env_path.exists():
            load_dotenv(env_path)
            print(f"{Colors.GREEN}✅{Colors.RESET} .env file loaded\n")
        else:
            print(f"{Colors.YELLOW}⚠️{Colors.RESET} .env file not found (normal for production)\n")
    except ImportError:
        print(f"{Colors.YELLOW}⚠️{Colors.RESET} python-dotenv not installed\n")
    
    required_env_vars = [
        ("SECRET_KEY", True),
        ("MONGO_URI", True),
        ("AWS_ACCESS_KEY_ID", True),
        ("AWS_SECRET_ACCESS_KEY", True),
        ("AWS_BUCKET_NAME", True),
        ("AWS_REGION", True),
        ("GOOGLE_CLIENT_ID", True),
        ("CORS_ORIGINS", True),
    ]
    
    optional_env_vars = [
        ("REDIS_URL", False),
        ("FLASK_ENV", False),
    ]
    
    print("Required:")
    for var_name, required in required_env_vars:
        total_checks += 1
        if check_env_variable(var_name, required):
            passed_checks += 1
    
    print("\nOptional:")
    for var_name, required in optional_env_vars:
        check_env_variable(var_name, required)
    
    # ==================== SECURITY CHECKS ====================
    print(f"\n{Colors.BLUE}🔒 SECURITY CONFIGURATION{Colors.RESET}")
    print("-" * 70)
    
    security_checks = [
        ("config.py", "SESSION_COOKIE_SECURE = True", "Secure cookies in production"),
        ("config.py", "SESSION_COOKIE_HTTPONLY = True", "HttpOnly cookies"),
        ("app.py", "X-Content-Type-Options", "Security headers configured"),
        ("app.py", "RATELIMIT", "Rate limiting configured"),
    ]
    
    for file_path, text, description in security_checks:
        total_checks += 1
        if Path(file_path).exists():
            with open(file_path, 'r') as f:
                content = f.read()
                if text in content:
                    print(f"{Colors.GREEN}✅{Colors.RESET} {description}")
                    passed_checks += 1
                else:
                    print(f"{Colors.YELLOW}⚠️{Colors.RESET} {description}: Not found")
        else:
            print(f"{Colors.RED}❌{Colors.RESET} {description}: File not found")
    
    # ==================== DATABASE ====================
    print(f"\n{Colors.BLUE}🗄️ DATABASE{Colors.RESET}")
    print("-" * 70)
    
    try:
        from db.client import get_db
        db = get_db()
        db.command("ping")
        print(f"{Colors.GREEN}✅{Colors.RESET} MongoDB connection successful")
        
        # Check collections
        collections = db.list_collection_names()
        required_collections = ["announcements", "genres", "podcasts", "materials", "self_help", "admin_emails"]
        
        for col in required_collections:
            if col in collections:
                count = db[col].count_documents({})
                print(f"{Colors.GREEN}✅{Colors.RESET} Collection '{col}': {count} documents")
            else:
                print(f"{Colors.YELLOW}⚠️{Colors.RESET} Collection '{col}': Not found")
        
    except Exception as e:
        print(f"{Colors.RED}❌{Colors.RESET} MongoDB connection failed: {e}")
    
    # ==================== FINAL SUMMARY ====================
    print("\n" + "="*70)
    print(f"{Colors.BLUE}📊 SUMMARY{Colors.RESET}")
    print("="*70)
    
    percentage = (passed_checks / total_checks * 100) if total_checks > 0 else 0
    
    print(f"\nPassed: {passed_checks}/{total_checks} ({percentage:.1f}%)")
    
    if percentage >= 95:
        print(f"\n{Colors.GREEN}🎉 EXCELLENT! Your project is production-ready!{Colors.RESET}")
    elif percentage >= 80:
        print(f"\n{Colors.YELLOW}⚠️ GOOD! Fix the remaining issues before deploying.{Colors.RESET}")
    else:
        print(f"\n{Colors.RED}❌ NOT READY! Please address the issues above.{Colors.RESET}")
    
    print("\n" + "="*70)
    
    # ==================== MANUAL CHECKS ====================
    print(f"\n{Colors.BLUE}📋 MANUAL CHECKS REQUIRED{Colors.RESET}")
    print("-" * 70)
    print(f"{Colors.YELLOW}⚠️{Colors.RESET} 1. Generate production SECRET_KEY with: python -c 'import secrets; print(secrets.token_hex(32))'")
    print(f"{Colors.YELLOW}⚠️{Colors.RESET} 2. Update CORS_ORIGINS to your production domain(s)")
    print(f"{Colors.YELLOW}⚠️{Colors.RESET} 3. Test all admin endpoints require authentication")
    print(f"{Colors.YELLOW}⚠️{Colors.RESET} 4. Verify MongoDB connection from production environment")
    print(f"{Colors.YELLOW}⚠️{Colors.RESET} 5. Test file uploads to S3")
    print(f"{Colors.YELLOW}⚠️{Colors.RESET} 6. Add admin emails to admin_emails collection")
    print(f"{Colors.YELLOW}⚠️{Colors.RESET} 7. Test announcements carousel locally first")
    print(f"{Colors.YELLOW}⚠️{Colors.RESET} 8. Review and test rate limiting")
    print(f"{Colors.YELLOW}⚠️{Colors.RESET} 9. Set up monitoring/logging (Sentry, CloudWatch)")
    print(f"{Colors.YELLOW}⚠️{Colors.RESET} 10. Test OAuth flow with production Google Client ID")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()