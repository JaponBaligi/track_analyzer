import time
from functools import wraps
from utils.logger import get_logger

logger = get_logger(__name__)

def retry(exceptions, tries=3, delay=2, backoff=2):
    """
    Basit retry dekoratörü.
    exceptions: Hangi exception'larda retry yapılacak.
    tries: Maksimum deneme sayısı.
    delay: İlk bekleme süresi (saniye).
    backoff: Bekleme süresinin kat sayısı.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            _tries, _delay = tries, delay
            while _tries > 1:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    logger.warning(f"Retrying {func.__name__} due to {e}, tries left: {_tries-1}")
                    time.sleep(_delay)
                    _tries -= 1
                    _delay *= backoff
            return func(*args, **kwargs)
        return wrapper
    return decorator
