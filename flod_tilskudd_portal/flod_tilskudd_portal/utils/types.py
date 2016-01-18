# -*- coding: utf-8 -*-
import collections
from datetime import datetime, timedelta


class StringUtils(object):
    @staticmethod
    def keep_alnum_only(input):
        """
        Will remove all non alfanumeric characters from the given string. A TypeError will be thrown if the given type
        is not a string.
        :param input: the string to filter
        :return: the filtered string
        """
        if isinstance(input, collections.Iterable):
            return ''.join(e for e in input if e.isalnum())
        else:
            raise TypeError("Parameteret må være iterable, '%s' er det ikke" % str(input))


class DateUtils(object):
    max_days_in_month = 31
    max_days_in_year = 365

    @staticmethod
    def add_days(datetime=datetime.now(), days=0):
        return datetime + timedelta(days=days)

    @staticmethod
    def add_months(datetime=datetime.now(), months=0):
        """
        OBS: This function is using an internal value representing the number of days in a month internally. As months
        are not all of same duration one should be careful what the result of this method is used to.

        The lager the number of months you add, the more surprising the result can be.

        :param datetime: the datetime to add months to
        :param months: the number of months to add
        :return: computed datetime
        """
        return datetime + timedelta(days=months * DateUtils.max_days_in_month)

    @staticmethod
    def add_years(datetime=datetime.now(), years=0):
        """
        OBS: This function is using an internal value representing the number of days in a year internally. As years
        are not all of same duration one should be careful what the result of this method is used to.

        The lager the number of years you add, the more surprising the result can be.

        :param datetime: the datetime to add years to
        :param years: the number of years to add
        :return: computed datetime
        """
        return datetime + timedelta(days=years * DateUtils.max_days_in_year)
