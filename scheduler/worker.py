import time
from scheduler.scheduler import start_scheduler
from utils.logger import get_logger

logger = get_logger(__name__)

def main():
    scheduler = start_scheduler()
    try:
        logger.info("Scheduler worker running. Press Ctrl+C to exit.")
        while True:
            time.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler worker shutting down...")
        raise

if __name__ == "__main__":
    main()
