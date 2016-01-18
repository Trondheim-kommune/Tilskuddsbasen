# -*- coding: utf-8 -*-
"""changed_etterspor_info_status

Revision ID: 28af58901fec
Revises: 453f3f2f2e5b
Create Date: 2014-11-28 14:33:49.473999

"""

# revision identifiers, used by Alembic.
from sqlalchemy.dialects.postgresql import ENUM

revision = '28af58901fec'
down_revision = '49e77b309da3'

from alembic import op
import sqlalchemy as sa



def upgrade():
    op.drop_column('soknader', 'status')
    ENUM(name="soknad_status_types").drop(op.get_bind(), checkfirst=False)
    new_status_enum = sa.Enum("Kladd",
                              "Innsendt",
                              "Trukket",
                              "Avsluttet",
                              "Under behandling",
                              u"Åpnet for redigering",
                              "Til vedtak",
                              "Vedtak fattet",
                              u"Vedtak påklaget",
                              "Til utbetaling",
                              "Avventer rapport",
                              u"Rapport påbegynt",
                              "Rapport levert",
                              "Tilbakebetaling kreves",
                              "Til klagevedtak", name='soknad_status_types')
    new_status_enum.create(op.get_bind())
    op.add_column('soknader', sa.Column('status', new_status_enum, nullable=True))


def downgrade():
    op.drop_column('soknader', 'status')
    ENUM(name="soknad_status_types").drop(op.get_bind(), checkfirst=False)
    new_status_enum = sa.Enum("Kladd",
                              "Innsendt",
                              "Trukket",
                              "Avsluttet",
                              "Under behandling",
                              "Etterspurt info",
                              "Til vedtak",
                              "Vedtak fattet",
                              u"Vedtak påklaget",
                              "Til utbetaling",
                              "Avventer rapport",
                              u"Rapport påbegynt",
                              "Rapport levert",
                              "Tilbakebetaling kreves",
                              "Til klagevedtak", name='soknad_status_types')
    new_status_enum.create(op.get_bind())
    op.add_column('soknader', sa.Column('status', new_status_enum, nullable=True))