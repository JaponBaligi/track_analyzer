from apscheduler.schedulers.background import BackgroundScheduler
from scheduler.tasks import scheduled_artist_scan
from scheduler.config import SCHEDULER_INTERVAL_MINUTES
from utils.logger import get_logger

logger = get_logger(__name__)

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        scheduled_artist_scan,
        'interval',
        minutes=SCHEDULER_INTERVAL_MINUTES,
        id='artist_scan_job',
        replace_existing=True
    )
    scheduler.start()
    logger.info("Scheduler started.")
    return scheduler
