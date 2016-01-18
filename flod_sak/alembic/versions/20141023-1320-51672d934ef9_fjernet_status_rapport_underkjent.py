# -*- coding: utf-8 -*-
"""fjernet status Rapport underkjent

Revision ID: 51672d934ef9
Revises: 59c403f20caa
Create Date: 2014-10-23 13:20:09.247565

"""

# revision identifiers, used by Alembic.
revision = '51672d934ef9'
down_revision = '59c403f20caa'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

def upgrade():
    op.drop_column('soknader', 'status')
    ENUM(name="soknad_status_types").drop(op.get_bind(), checkfirst=False)
    new_status_enum = sa.Enum('Kladd',
                              'Innsendt',
                              'Trukket',
                              'Avsluttet',
                              'Under behandling',
                              'Etterspurt info',
                              'Til vedtak',
                              'Vedtak fattet',
                              u'Vedtak påklaget',
                              'Til utbetaling',
                              'Avventer rapport',
                              u'Rapport påbegynt',
                              'Rapport levert',
                              'Tilbakebetaling kreves', name='soknad_status_types')
    new_status_enum.create(op.get_bind())
    op.add_column('soknader', sa.Column('status', new_status_enum, nullable=True))


def downgrade():
    op.drop_column('soknader', 'status')
    ENUM(name="soknad_status_types").drop(op.get_bind(), checkfirst=False)
    new_status_enum = sa.Enum('Kladd',
                              'Innsendt',
                              'Trukket',
                              'Avsluttet',
                              'Under behandling',
                              'Etterspurt info',
                              'Til vedtak',
                              'Vedtak fattet',
                              u'Vedtak påklaget',
                              'Til utbetaling',
                              'Avventer rapport',
                              u'Rapport påbegynt',
                              'Rapport levert',
                              'Rapport underkjent',
                              'Tilbakebetaling kreves', name='soknad_status_types')
    new_status_enum.create(op.get_bind())
    op.add_column('soknader', sa.Column('status', new_status_enum, nullable=True))

